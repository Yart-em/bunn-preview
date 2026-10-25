/**
 * BelowFold's sections in mount order, top to bottom — one per idle
 * callback (see BelowFoldMount in App.tsx). Kept out of BelowFold.tsx
 * so the entry bundle knows the count without loading that chunk
 * (and so BelowFold.tsx only exports components, for fast refresh).
 */
export const BELOW_FOLD_STAGES = [
  'how',
  'info',
  'logos',
  'carousel',
  'brokers',
  'faq',
  'cityscape',
  'footer',
] as const;

export type BelowFoldStage = (typeof BELOW_FOLD_STAGES)[number];
