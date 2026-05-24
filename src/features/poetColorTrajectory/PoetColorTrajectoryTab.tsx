import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { LoadingBlock } from '../../components/Loading';
import { SectionHeader } from '../../tabs/common';
import { colorGroups } from '../../utils/format';
import { usePoetColorTrajectoryData } from './trajectoryData';
import { ColorTimelineHeatmap } from './ColorTimelineHeatmap';
import { DominantColorPath } from './DominantColorPath';
import { EmotionSceneMatrix } from './EmotionSceneMatrix';
import { PoetLifeEventRail } from './PoetLifeEventRail';
import { PoetColorRiver } from './PoetColorRiver';
import { PoetSelector } from './PoetSelector';
import { TrajectoryCompareView } from './TrajectoryCompareView';
import { TrajectoryControls } from './TrajectoryControls';
import { TrajectoryDetailDrawer } from './TrajectoryDetailDrawer';
import type {
  SemanticLayer,
  TimeGranularity,
  TrajectoryDetail,
  TrajectoryMetric,
  UncertaintyMode,
} from './trajectoryTypes';
import { filteredBins, generatePoetTrajectorySummary, preferredPoets } from './trajectoryUtils';

export function PoetColorTrajectoryTab() {
  const { data, loading, error } = usePoetColorTrajectoryData();
  const [selectedPoetId, setSelectedPoetId] = useState('');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('stage');
  const [metric, setMetric] = useState<TrajectoryMetric>('share');
  const [colorGroup, setColorGroup] = useState(colorGroups[0]);
  const [semanticLayer, setSemanticLayer] = useState<SemanticLayer>('emotion');
  const [uncertaintyMode, setUncertaintyMode] = useState<UncertaintyMode>('hide-unknown');
  const [compareMode, setCompareMode] = useState(false);
  const [focusedStageId, setFocusedStageId] = useState('');
  const [lockedColor, setLockedColor] = useState('');
  const [detail, setDetail] = useState<TrajectoryDetail | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);

  const poets = data?.poets || [];
  const selectedPoet = useMemo(() => {
    if (!poets.length) return null;
    return poets.find((poet) => poet.poet_id === selectedPoetId)
      || preferredPoets.map((name) => poets.find((poet) => poet.name === name)).find(Boolean)
      || poets[0];
  }, [poets, selectedPoetId]);
  const meaningfulBins = selectedPoet ? filteredBins(selectedPoet, uncertaintyMode).filter((stage) => stage.bin_id !== 'unknown' && stage.color_total > 0) : [];
  const focusStage = selectedPoet?.time_bins.find((stage) => stage.bin_id === focusedStageId) || meaningfulBins[0] || selectedPoet?.time_bins[0];

  if (loading) return <LoadingBlock label="正在加载诗人色彩轨迹数据" />;
  if (error || !data || !selectedPoet) return <EmptyState message="诗人色彩轨迹数据加载失败。" />;

  return (
    <section className="space-y-5">
      <div className="panel p-4 md:p-6">
        <SectionHeader
          title="诗人色彩轨迹"
          description="把分析单位从单个颜色词转向“诗人 × 时间 × 色彩”，观察不同创作阶段中的色彩使用分布、主导色迁移，以及色彩与情感 / 场景的关联变化。"
          hint="研究问题：色彩轨迹可视化如何支持用户基于诗人生平时间轴进行跨时期、跨情境的诠释推理？无法定位的诗作保留为“未定年”，默认不进入时间轴。"
        />
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <PoetSelector
            poets={poets}
            selectedPoet={selectedPoet}
            onSelect={(poet) => {
              setSelectedPoetId(poet.poet_id);
              setFocusedStageId('');
              setLockedColor('');
            }}
          />
          <TrajectoryControls
            timeGranularity={timeGranularity}
            setTimeGranularity={setTimeGranularity}
            metric={metric}
            setMetric={setMetric}
            colorGroup={colorGroup}
            setColorGroup={setColorGroup}
            semanticLayer={semanticLayer}
            setSemanticLayer={setSemanticLayer}
            uncertaintyMode={uncertaintyMode}
            setUncertaintyMode={setUncertaintyMode}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
          />
        </div>
      </div>

      {compareMode ? (
        <div className="panel p-4 md:p-6">
          <TrajectoryCompareView poets={poets} metric={metric} onDetail={setDetail} />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <PoetLifeEventRail
            poet={selectedPoet}
            selectedStageId={focusStage?.bin_id || ''}
            onStageSelect={(stage) => {
              setFocusedStageId(stage.bin_id);
              setDetail({ type: 'stage', poet: selectedPoet, stage });
            }}
            onEventSelect={(event, before, after) => {
              setTimeGranularity('event');
              setFocusedStageId(after?.bin_id || before?.bin_id || '');
              setDetail({ type: 'event', poet: selectedPoet, event, before, after });
            }}
          />
          <div className="space-y-5">
            <div className="rounded-xl border border-stone-200 bg-white/42 p-4">
              <p className="text-xs text-cinnabar">轨迹摘要</p>
              <p className="mt-2 text-sm leading-7 text-mutedInk">{generatePoetTrajectorySummary(selectedPoet)}</p>
              {selectedPoet.summary_stats.dated_poem_count < 5 ? (
                <p className="mt-2 rounded-lg bg-cinnabar/8 p-3 text-sm leading-6 text-cinnabar">该诗人可定位诗作较少，当前结果更适合作为探索线索，而非稳定结论。</p>
              ) : null}
            </div>
            <ColorTimelineHeatmap
              poet={selectedPoet}
              metric={metric}
              colorGroup={colorGroup}
              timeGranularity={timeGranularity}
              semanticLayer={semanticLayer}
              uncertaintyMode={uncertaintyMode}
              focusedStageId={focusStage?.bin_id || ''}
              lockedColor={lockedColor}
              onColorLock={setLockedColor}
              onStageClick={(stage) => {
                setFocusedStageId(stage.bin_id);
                setDetail({ type: 'stage', poet: selectedPoet, stage });
              }}
              onCellClick={(stage, color) => {
                setFocusedStageId(stage.bin_id);
                setLockedColor(color.color);
                setDetail({ type: 'cell', poet: selectedPoet, stage, color });
              }}
            />
            <PoetColorRiver
              poet={selectedPoet}
              metric={metric}
              uncertaintyMode={uncertaintyMode}
              colorGroup={colorGroup}
              lockedColor={lockedColor}
              onColorLock={setLockedColor}
              onDetail={setDetail}
            />
            <DominantColorPath
              poet={selectedPoet}
              uncertaintyMode={uncertaintyMode}
              metric={metric}
              focusedStageId={focusStage?.bin_id || ''}
              onStageClick={(stage) => {
                setFocusedStageId(stage.bin_id);
                setDetail({ type: 'stage', poet: selectedPoet, stage });
              }}
            />
            <EmotionSceneMatrix
              poet={selectedPoet}
              semanticLayer={semanticLayer}
              uncertaintyMode={uncertaintyMode}
              focusedStageId={focusStage?.bin_id || ''}
              onStageClick={(stage) => {
                setFocusedStageId(stage.bin_id);
                setDetail({ type: 'stage', poet: selectedPoet, stage });
              }}
            />
          </div>
        </div>
      )}

      <details className="panel p-4 md:p-6" open={methodOpen} onToggle={(event) => setMethodOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer font-song text-xl font-semibold">方法说明：什么是诗人的色彩轨迹？</summary>
        <div className="mt-4 grid gap-4 text-sm leading-7 text-mutedInk md:grid-cols-2">
          <p><strong className="text-ink">分析单位：</strong>本视图将分析单位从单个颜色词扩展为 poet × time × color 的交叉空间。</p>
          <p><strong className="text-ink">时间轴构建：</strong>诗作根据明确年份、年份范围或可考人生阶段进行归类。无法定位的诗作被标记为未定年。</p>
          <p><strong className="text-ink">色彩统计：</strong>颜色词通过颜色词典从诗句中提取，并按阶段聚合。可选择原始次数、每首诗归一化、每千字归一化或阶段占比。</p>
          <p><strong className="text-ink">情绪与场景：</strong>情绪和场景标签基于规则词典从诗句上下文中提取，主要用于探索性解释，不等同于最终文学定论。</p>
          <p className="md:col-span-2"><strong className="text-ink">局限性：</strong>古诗创作年份常有不确定性；部分诗作作者或年代可能存在争议；单字颜色词可能存在非颜色用法；色值是现代可视化近似；生平阶段划分具有解释性，不是唯一划分方式。</p>
          <p className="md:col-span-2">数据说明：{data.note}</p>
        </div>
      </details>

      <TrajectoryDetailDrawer detail={detail} onClose={() => setDetail(null)} />
    </section>
  );
}
