const BASE = "https://api.jolpi.ca/ergast/f1";

// Simple in-memory cache. Process-lifetime only, which is fine for a side project.
const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 1000 * 60 * 60; // 1 hour; F1 historical data does not change

async function cachedGet(path: string): Promise<any> {
    const now = Date.now();
    const hit = cache.get(path);
    if (hit && hit.expires > now) return hit.data;

    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) {
        throw new Error(`F1 API ${res.status} for ${path}`);
    }
    const data = await res.json();
    cache.set(path, { data, expires: now + TTL_MS });
    return data;
}

export async function listRaces(season: string) {
    const json = await cachedGet(`/${season}.json`);
    return json.MRData.RaceTable.Races.map((r: any) => ({
        round: r.round,
        raceName: r.raceName,
        circuit: r.Circuit.circuitName,
        date: r.date,
    }));
}

export async function resolveDriver(season: string, query: string) {
    const json = await cachedGet(`/${season}/drivers.json`);
    const drivers = json.MRData.DriverTable.Drivers;
    const q = query.toLowerCase();
    const match = drivers.find(
        (d: any) =>
            d.driverId.toLowerCase() === q ||
            d.familyName.toLowerCase() === q ||
            `${d.givenName} ${d.familyName}`.toLowerCase() === q ||
            d.code?.toLowerCase() === q
    );
    if (!match) {
        const names = drivers.map((d: any) => `${d.givenName} ${d.familyName}`);
        throw new Error(
            `No driver matching "${query}" in ${season}. Available: ${names.join(", ")}`
        );
    }
    return { driverId: match.driverId, name: `${match.givenName} ${match.familyName}` };
}

export async function getLapTimes(season: string, round: string, driverId: string) {
    // Jolpica paginates lap data; one page (limit 100) covers most races.
    const json = await cachedGet(`/${season}/${round}/drivers/${driverId}/laps.json?limit=100`);
    const laps = json.MRData.RaceTable.Races[0]?.Laps ?? [];
    return laps.map((lap: any) => ({
        lap: Number(lap.number),
        time: lap.Timings[0]?.time ?? null,
    }));
}

export async function getRaceResults(season: string, round: string) {
    const json = await cachedGet(`/${season}/${round}/results.json`);
    const results = json.MRData.RaceTable.Races[0]?.Results ?? [];
    return results.map((r: any) => ({
        position: Number(r.position),
        driver: `${r.Driver.givenName} ${r.Driver.familyName}`,
        constructor: r.Constructor.name,
        status: r.status,
    }));
}