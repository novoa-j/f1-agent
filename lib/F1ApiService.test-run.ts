// Quick manual test runner. Run with: node lib/F1ApiService.test-run.ts
import { listRaces, resolveDriver, getLapTimes, getRaceResults } from "./F1ApiService.ts";

async function main() {
    console.log("== listRaces(2023) ==");
    const races = await listRaces("2023");
    console.log(races.slice(0, 3));

    console.log("\n== resolveDriver(2023, 'verstappen') ==");
    const driver = await resolveDriver("2023", "verstappen");
    console.log(driver);

    console.log("\n== getRaceResults(2023, '1') ==");
    const results = await getRaceResults("2023", "1");
    console.log(results.slice(0, 3));

    console.log("\n== getLapTimes(2023, '1', driver) ==");
    const laps = await getLapTimes("2023", "1", driver.driverId);
    console.log(laps.slice(0, 3));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
