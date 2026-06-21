import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { tools } from "@/lib/tools";
import { ChartSpec } from "@/lib/schema";
import { listRaces, resolveDriver, getLapTimes, getRaceResults } from "@/lib/F1ApiService";

const MAX_STEPS = 8;
// app/api/agent/route.ts
export const maxDuration = 60; // seconds
export const runtime = 'nodejs'; // Anthropic SDK needs Node, not edge

// Cap every Anthropic request at the function's overall budget. timeout is in
// milliseconds and applies to all client.messages.create calls.
const client = new Anthropic({ timeout: maxDuration * 1000 }); // reads ANTHROPIC_API_KEY from env

async function runTool(name: string, input: any): Promise<string> {
  try {
    switch (name) {
      case "list_races":
        return JSON.stringify(await listRaces(input.season));
      case "resolve_driver":
        return JSON.stringify(await resolveDriver(input.season, input.query));
      case "get_lap_times":
        return JSON.stringify(await getLapTimes(input.season, input.round, input.driverId));
      case "get_race_results":
        return JSON.stringify(await getRaceResults(input.season, input.round));
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    // Return the error as a string so the model can read and recover from it.
    return `ERROR: ${err.message}`;
  }
}

const SYSTEM = `You are an F1 data visualization agent.
Given a question, gather the data you need with the tools, then call render_chart with a final spec.
Resolve driver names and Grand Prix names to IDs and round numbers before fetching detailed data.
If a tool returns an ERROR, read it and adjust (for example, pick a corrected driver name from the list provided).
If the question is genuinely ambiguous, call render_chart with a short clarifying title is NOT allowed; instead ask one clarifying question in plain text and stop.
Prefer a line chart for anything over laps or time, and a bar chart for finishing positions or counts.`;

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: question },
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      tools: tools as any,
      messages,
    });

    // Did the model ask for any tools?
    const toolUses = response.content.filter((b) => b.type === "tool_use");

    // No tools: the model is either asking a clarifying question or answering in text.
    if (toolUses.length === 0) {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      return NextResponse.json({ kind: "text", text });
    }

    // Check for the terminal render_chart call.
    const render = toolUses.find((b: any) => b.name === "render_chart");
    if (render) {
      const parsed = ChartSpec.safeParse((render as any).input);
      if (parsed.success) {
        return NextResponse.json({ kind: "chart", spec: parsed.data });
      }
      // Spec failed validation: feed the error back and let the model fix it.
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: (render as any).id,
            content: `Chart spec invalid: ${parsed.error.message}. Fix and call render_chart again.`,
            is_error: true,
          },
        ],
      });
      continue;
    }

    // Otherwise run the requested data tools and feed results back.
    messages.push({ role: "assistant", content: response.content });
    const toolResults = await Promise.all(
      toolUses.map(async (tu: any) => ({
        type: "tool_result" as const,
        tool_use_id: tu.id,
        content: await runTool(tu.name, tu.input),
      }))
    );
    messages.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({
    kind: "text",
    text: "I could not complete that within the step budget. Try narrowing the question.",
  });
}