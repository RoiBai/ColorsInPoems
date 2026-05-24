import type { SemanticLayer, TimeGranularity, TrajectoryMetric, UncertaintyMode } from './trajectoryTypes';
import { ChipGroup, Toggle } from '../../tabs/common';
import { colorGroups } from '../../utils/format';

export function TrajectoryControls({
  timeGranularity,
  setTimeGranularity,
  metric,
  setMetric,
  colorGroup,
  setColorGroup,
  semanticLayer,
  setSemanticLayer,
  uncertaintyMode,
  setUncertaintyMode,
  compareMode,
  setCompareMode,
}: {
  timeGranularity: TimeGranularity;
  setTimeGranularity: (value: TimeGranularity) => void;
  metric: TrajectoryMetric;
  setMetric: (value: TrajectoryMetric) => void;
  colorGroup: string;
  setColorGroup: (value: string) => void;
  semanticLayer: SemanticLayer;
  setSemanticLayer: (value: SemanticLayer) => void;
  uncertaintyMode: UncertaintyMode;
  setUncertaintyMode: (value: UncertaintyMode) => void;
  compareMode: boolean;
  setCompareMode: (value: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-cinnabar">诗人 × 时间 × 色彩</p>
          <h3 className="font-song text-xl font-semibold">轨迹控制区</h3>
        </div>
        <Toggle checked={compareMode} label={compareMode ? '轨迹比较' : '单诗人模式'} onChange={setCompareMode} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChipGroup
          label="时间粒度"
          options={['按年份', '按年龄', '按人生阶段', '按生平事件前后']}
          value={{ year: '按年份', age: '按年龄', stage: '按人生阶段', event: '按生平事件前后' }[timeGranularity]}
          onChange={(value) => setTimeGranularity({ 按年份: 'year', 按年龄: 'age', 按人生阶段: 'stage', 按生平事件前后: 'event' }[value] as TimeGranularity)}
        />
        <ChipGroup
          label="指标切换"
          options={['原始出现次数', '每首诗归一化', '每千字归一化', '该阶段颜色占比']}
          value={{ count: '原始出现次数', per_poem: '每首诗归一化', per_1000_chars: '每千字归一化', share: '该阶段颜色占比' }[metric]}
          onChange={(value) =>
            setMetric({ 原始出现次数: 'count', 每首诗归一化: 'per_poem', 每千字归一化: 'per_1000_chars', 该阶段颜色占比: 'share' }[value] as TrajectoryMetric)
          }
        />
        <ChipGroup label="色系筛选" options={colorGroups} value={colorGroup} onChange={setColorGroup} />
        <ChipGroup
          label="语义层"
          options={['只看颜色', '颜色 + 情绪', '颜色 + 场景', '颜色 + 生平事件']}
          value={{ color: '只看颜色', emotion: '颜色 + 情绪', scene: '颜色 + 场景', event: '颜色 + 生平事件' }[semanticLayer]}
          onChange={(value) => setSemanticLayer({ 只看颜色: 'color', '颜色 + 情绪': 'emotion', '颜色 + 场景': 'scene', '颜色 + 生平事件': 'event' }[value] as SemanticLayer)}
        />
        <ChipGroup
          label="不确定时间处理"
          options={['显示未定年诗作', '隐藏未定年诗作', '仅显示可确定阶段诗作']}
          value={{ 'show-unknown': '显示未定年诗作', 'hide-unknown': '隐藏未定年诗作', 'only-dated': '仅显示可确定阶段诗作' }[uncertaintyMode]}
          onChange={(value) =>
            setUncertaintyMode({ 显示未定年诗作: 'show-unknown', 隐藏未定年诗作: 'hide-unknown', 仅显示可确定阶段诗作: 'only-dated' }[value] as UncertaintyMode)
          }
        />
      </div>
    </div>
  );
}
