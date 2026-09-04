import { z } from 'zod';

export const ModelMeasurementsSchema = z.object({
  height: z.string(),
  bust: z.string(),
  waist: z.string(),
  hips: z.string(),
  wearingSize: z.string(),
});

export type ModelMeasurements = z.infer<typeof ModelMeasurementsSchema>;

export const SizeChartRowSchema = z.object({
  label: z.string(),
  chest: z.string().optional(),
  waist: z.string().optional(),
  hips: z.string().optional(),
  length: z.string().optional(),
});

export type SizeChartRow = z.infer<typeof SizeChartRowSchema>;

export const SizeRecommendationInputSchema = z.object({
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export type SizeRecommendationInput = z.infer<typeof SizeRecommendationInputSchema>;

export const DEFAULT_MODEL_MEASUREMENTS: ModelMeasurements = {
  height: '5\'9" / 175 cm',
  bust: '32" / 81 cm',
  waist: '24" / 61 cm',
  hips: '34" / 86 cm',
  wearingSize: 'S',
};

export function parseSizeChartFromAttributes(attributes: Record<string, unknown> | undefined): SizeChartRow[] {
  if (!attributes) return fallbackChart();
  const rawChart = attributes['sizeChart'] as unknown;
  if (Array.isArray(rawChart) && rawChart.length > 0) {
    return rawChart as SizeChartRow[];
  }
  const sizes = attributes['size'] as unknown;
  if (Array.isArray(sizes) && sizes.length > 0) {
    return (sizes as string[]).map((label) => ({ label }));
  }
  return fallbackChart();
}

function fallbackChart(): SizeChartRow[] {
  return [
    { label: 'XS', chest: '34"', waist: '28"', hips: '34"' },
    { label: 'S', chest: '36"', waist: '30"', hips: '36"' },
    { label: 'M', chest: '38"', waist: '32"', hips: '38"' },
    { label: 'L', chest: '40"', waist: '34"', hips: '40"' },
    { label: 'XL', chest: '42"', waist: '36"', hips: '42"' },
  ];
}

export function recommendSize(input: SizeRecommendationInput, rows: SizeChartRow[]): string | null {
  if (rows.length === 0) return null;
  // Naive heuristic: map chest/waist inches to label by closest match on waist then chest
  const waist = input.waist;
  const chest = input.chest;
  if (waist === undefined && chest === undefined) return null;

  // Extract numeric waist from chart rows
  const scored = rows.map((row) => {
    const waistNum = row.waist ? parseInt(row.waist, 10) : undefined;
    const chestNum = row.chest ? parseInt(row.chest, 10) : undefined;
    let score = 0;
    let hasData = false;
    if (waist !== undefined && waistNum !== undefined) {
      score += Math.abs(waist - waistNum);
      hasData = true;
    }
    if (chest !== undefined && chestNum !== undefined) {
      score += Math.abs(chest - chestNum);
      hasData = true;
    }
    return { label: row.label, score: hasData ? score : 999 };
  });
  scored.sort((a, b) => a.score - b.score);
  if (scored[0].score >= 999) return rows[1]?.label ?? rows[0].label;
  return scored[0].label;
}
