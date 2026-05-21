export type ImportStage =
  | 'reading'
  | 'decoding'
  | 'chapters'
  | 'pagination'
  | 'finalizing';

export type ImportProgress = {
  stage: ImportStage;
  percent: number; // 0-100
  message: string;
};
