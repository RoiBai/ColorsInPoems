export type DetailType = 'color' | 'poet' | 'imagery' | 'poem' | 'dynasty' | 'combo' | 'methodology';

export type SampleLine = {
  poem_id: string;
  title: string;
  author: string;
  dynasty: string;
  line_text: string;
};

export type DetailRequest = {
  type: DetailType;
  id?: string;
  title?: string;
  payload?: Record<string, unknown>;
};

export type Overview = {
  generated_at: string;
  poem_count: number;
  poet_count: number;
  color_word_count: number;
  color_occurrence_count: number;
  dynasty_count: number;
  source_count: number;
  dynasties: string[];
  note: string;
};

export type ColorDetail = {
  color_word: string;
  normalized_color: string;
  color_group: string;
  hex: string;
  total_count: number;
  dynasty_distribution: Array<{ dynasty: string; count: number }>;
  top_poets: Array<{ poet: string; dynasty: string; count: number }>;
  top_imageries: Array<{ imagery: string; category: string; count: number }>;
  top_emotions: Array<{ emotion: string; count: number }>;
  sample_lines: SampleLine[];
};

export type PoetDetail = {
  poet: string;
  dynasty: string;
  poem_count: number;
  color_total: number;
  top_colors: Array<{ color: string; group: string; hex: string; count: number }>;
  top_imageries: Array<{ imagery: string; category: string; count: number }>;
  sample_lines: SampleLine[];
};

export type Poem = {
  poem_id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string;
  lines: string[];
  source_id: string;
  source_ref?: string;
};

export type PoetColorEdge = {
  poet: string;
  dynasty: string;
  color: string;
  color_group: string;
  hex: string;
  count: number;
  sample_lines: SampleLine[];
};

export type PoetColorStats = {
  title: string;
  description: string;
  dynasty_options: string[];
  famous_poets: string[];
  color_groups: string[];
  poet_counts: Array<{ poet: string; count: number }>;
  color_counts: Array<{ color: string; count: number }>;
  edges: PoetColorEdge[];
};

export type DynastyColorItem = {
  color: string;
  color_group: string;
  hex: string;
  count: number;
  per_thousand_poems: number;
  share: number;
  previous_comparison: { status: string; delta: number };
  sample_line: SampleLine | null;
};

export type DynastyTopStats = {
  title: string;
  description: string;
  dynasties: string[];
  data: Record<
    string,
    {
      dynasty: string;
      poem_count: number;
      color_total: number;
      top_colors: DynastyColorItem[];
    }
  >;
};

export type BubbleColor = { color: string; group: string; hex: string; count: number };

export type ImageryBubble = {
  id: string;
  name: string;
  category: string;
  kind: string;
  poem_count: number;
  count: number;
  main_color: BubbleColor;
  colors: BubbleColor[];
  top_poets: Array<{ poet: string; count: number }>;
  dynasty_distribution: Array<{ dynasty: string; count: number }>;
  sample_lines: SampleLine[];
};

export type ImageryBubbleStats = {
  title: string;
  description: string;
  hint: string;
  categories: string[];
  bubbles: ImageryBubble[];
};

export type PoemColorBand = {
  poem_id: string;
  title: string;
  author: string;
  dynasty: string;
  source_id: string;
  source_ref?: string;
  color_count: number;
  colors: Array<{ color: string; word: string; group: string; hex: string; line_text: string }>;
};

export type EmotionSpectrumRow = {
  emotion: string;
  total_count: number;
  main_color: { color: string; group: string; hex: string; count: number } | null;
  colors: Array<{
    color: string;
    group: string;
    hex: string;
    count: number;
    imageries: Array<{ imagery: string; count: number }>;
    sample_lines: SampleLine[];
  }>;
};

export type DynastyStreamStats = {
  dynasties: string[];
  colors: Array<{ color: string; group: string; hex: string }>;
  rows: Array<{
    dynasty: string;
    color: string;
    color_group: string;
    hex: string;
    count: number;
    per_thousand_poems: number;
    per_ten_thousand_chars: number;
    top_poets: Array<{ poet: string; count: number }>;
    top_imageries: Array<{ imagery: string; count: number }>;
    sample_line: SampleLine | null;
  }>;
};

export type SearchIndex = {
  poets: Array<{ type: 'poet'; id: string; label: string; meta: string }>;
  colors: Array<{ type: 'color'; id: string; label: string; meta: string }>;
  poems: Array<{ type: 'poem'; id: string; label: string; meta: string }>;
  imageries: Array<{ type: 'imagery'; id: string; label: string; meta: string }>;
};
