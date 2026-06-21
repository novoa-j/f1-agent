"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#e10600", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa"];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>F1 Data Agent</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1, padding: 10 }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Compare Verstappen and Hamilton lap times, 2023 Monaco GP"
          onKeyDown={(e) => e.key === "Enter" && ask()}
        />
        <button onClick={ask} disabled={loading || !question}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {result?.kind === "text" && (
        <p style={{ marginTop: 24 }}>{result.text}</p>
      )}

      {result?.kind === "chart" && (
        <div style={{ marginTop: 24 }}>
          <h2>{result.spec.title}</h2>
          <ResponsiveContainer width="100%" height={420}>
            {result.spec.chartType === "line" ? (
              <LineChart data={result.spec.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={result.spec.xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {result.spec.series.map((s: any, i: number) => (
                  <Line key={s.key} dataKey={s.key} name={s.label} stroke={COLORS[i % COLORS.length]} dot={false} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={result.spec.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={result.spec.xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {result.spec.series.map((s: any, i: number) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </main>
  );
}