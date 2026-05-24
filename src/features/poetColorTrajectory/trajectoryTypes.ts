import type { SampleLine } from '../../types';

export type DateCertainty = 'exact' | 'estimated' | 'range' | 'stage' | 'unknown';
export type TrajectoryMetric = 'count' | 'per_poem' | 'per_1000_chars' | 'share';
export type TimeGranularity = 'year' | 'age' | 'stage' | 'event';
export type SemanticLayer = 'color' | 'emotion' | 'scene' | 'event';
export type UncertaintyMode = 'show-unknown' | 'hide-unknown' | 'only-dated';
export type CompareAlignMode = 'age' | 'absolute-year' | 'life-stage';

export type TrajectorySampleLine = SampleLine & {
  year: number | null;
  year_range: [number, number] | null;
  date_certainty: DateCertainty;
  source_ref: string;
};

export type PoetLifeStage = {
  stage_id: string;
  label: string;
  start_year: number;
  end_year: number;
  type: string;
  description: string;
  source_ref: string;
};

export type PoetLifeEvent = {
  event_id: string;
  label: string;
  year: number;
  type: string;
  description: string;
  source_ref: string;
};

export type StageColor = {
  color: string;
  normalized_color: string;
  color_group: string;
  hex: string;
  ambiguity_note?: string;
  count: number;
  per_poem: number;
  per_1000_chars: number;
  share: number;
  sample_lines: TrajectorySampleLine[];
};

export type DominantColor = {
  color: string;
  hex: string;
  count: number;
  share: number;
};

export type StageEmotion = {
  emotion: string;
  count: number;
  top_colors: Array<{ color: string; hex: string; count: number }>;
};

export type StageScene = {
  scene: string;
  count: number;
  top_colors: Array<{ color: string; hex: string; count: number }>;
};

export type StageInterpretation = {
  summary: string;
  dominantColorSentence: string;
  changeSentence: string;
  emotionSceneSentence: string;
  caution: string;
};

export type TrajectoryStageBin = {
  bin_id: string;
  label: string;
  start_year: number | null;
  end_year: number | null;
  age_start: number | null;
  age_end: number | null;
  life_stage_id: string | null;
  life_stage_label: string;
  stage_type: string;
  stage_description: string;
  stage_source_ref: string;
  poem_count: number;
  color_total: number;
  char_count: number;
  date_certainty_mix: Record<DateCertainty, number>;
  colors: StageColor[];
  dominant_colors: DominantColor[];
  emotions: StageEmotion[];
  scenes: StageScene[];
  sample_lines: TrajectorySampleLine[];
  change_from_previous: {
    rising_colors: Array<{ color: string; delta_share: number }>;
    falling_colors: Array<{ color: string; delta_share: number }>;
    new_colors: string[];
  };
  interpretation: StageInterpretation;
};

export type PoetTrajectory = {
  poet_id: string;
  name: string;
  dynasty: string;
  birth_year: number | null;
  death_year: number | null;
  summary: string;
  events: PoetLifeEvent[];
  stages: PoetLifeStage[];
  summary_stats: {
    poem_count: number;
    dated_poem_count: number;
    unknown_poem_count: number;
    color_occurrence_count: number;
    top_colors: Array<{ color: string; hex: string; count: number }>;
  };
  time_bins: TrajectoryStageBin[];
  trajectory_summary: string;
};

export type PoetColorTrajectoryData = {
  generated_at: string;
  certainty_labels: Record<DateCertainty, string>;
  metric_labels: Record<TrajectoryMetric, string>;
  note: string;
  poets: PoetTrajectory[];
};

export type TrajectoryDetail =
  | { type: 'stage'; poet: PoetTrajectory; stage: TrajectoryStageBin }
  | { type: 'cell'; poet: PoetTrajectory; stage: TrajectoryStageBin; color: StageColor }
  | { type: 'event'; poet: PoetTrajectory; event: PoetLifeEvent; before?: TrajectoryStageBin; after?: TrajectoryStageBin }
  | { type: 'comparison'; poets: PoetTrajectory[]; text: string };
