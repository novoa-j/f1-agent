import { z } from "zod";

export const ChartSpec = z.object({
  chartType: z.enum(["line", "bar"]),
  title: z.string(),
  xKey: z.string(),
  series: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
    })
  ),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
});

export type ChartSpec = z.infer<typeof ChartSpec>;