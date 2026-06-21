export const tools = [
  {
    name: "list_races",
    description: "List all races in a given F1 season. Use to resolve a Grand Prix name to a round number.",
    input_schema: {
      type: "object",
      properties: { season: { type: "string", description: "Season year, e.g. 2023" } },
      required: ["season"],
    },
  },
  {
    name: "resolve_driver",
    description: "Resolve a driver name or nickname to a driver ID for a given season. Call before fetching lap times.",
    input_schema: {
      type: "object",
      properties: {
        season: { type: "string" },
        query: { type: "string", description: "Driver name as the user wrote it" },
      },
      required: ["season", "query"],
    },
  },
  {
    name: "get_lap_times",
    description: "Get lap-by-lap times for one driver in one race. Requires a resolved driverId and round.",
    input_schema: {
      type: "object",
      properties: {
        season: { type: "string" },
        round: { type: "string" },
        driverId: { type: "string" },
      },
      required: ["season", "round", "driverId"],
    },
  },
  {
    name: "get_race_results",
    description: "Get finishing positions for all drivers in one race.",
    input_schema: {
      type: "object",
      properties: { season: { type: "string" }, round: { type: "string" } },
      required: ["season", "round"],
    },
  },
  {
    name: "render_chart",
    description:
      "Terminal action. Emit the final chart specification once you have all the data. Calling this ends the task.",
    input_schema: {
      type: "object",
      properties: {
        chartType: { type: "string", enum: ["line", "bar"] },
        title: { type: "string" },
        xKey: { type: "string" },
        series: { type: "array" },
        data: { type: "array" },
      },
      required: ["chartType", "title", "xKey", "series", "data"],
    },
  },
];