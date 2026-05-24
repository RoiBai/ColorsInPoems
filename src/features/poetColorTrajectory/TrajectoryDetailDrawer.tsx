import type { TrajectoryDetail, TrajectoryStageBin } from './trajectoryTypes';
import { generateStageInterpretation, metricFormat } from './trajectoryUtils';
import { LinesList } from '../../tabs/common';
import { cnNumber, lineLabel } from '../../utils/format';

function ChangeList({ stage }: { stage: TrajectoryStageBin }) {
  return (
    <div className="grid gap-2 text-sm text-mutedInk">
      <p>上升：{stage.change_from_previous.rising_colors.map((item) => `${item.color} ${(item.delta_share * 100).toFixed(1)}%`).join('、') || '暂无'}</p>
      <p>下降：{stage.change_from_previous.falling_colors.map((item) => `${item.color} ${(item.delta_share * 100).toFixed(1)}%`).join('、') || '暂无'}</p>
      <p>新出现：{stage.change_from_previous.new_colors.join('、') || '暂无'}</p>
    </div>
  );
}

export function TrajectoryDetailDrawer({ detail, onClose }: { detail: TrajectoryDetail | null; onClose: () => void }) {
  if (!detail) return null;

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[86vh] overflow-hidden rounded-t-2xl border border-stone-200 bg-paper shadow-paper md:inset-y-0 md:left-auto md:right-0 md:h-screen md:max-h-none md:w-[460px] md:rounded-none">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <span className="text-sm text-mutedInk">色彩轨迹详情</span>
        <button className="soft-button" type="button" onClick={onClose}>关闭</button>
      </div>
      <div className="h-[calc(86vh-72px)] overflow-y-auto p-5 md:h-[calc(100vh-72px)]">
        {detail.type === 'stage' ? (
          <section className="space-y-5">
            <div>
              <p className="drawer-eyebrow">阶段色彩画像</p>
              <h2 className="drawer-title">{detail.poet.name} · {detail.stage.life_stage_label}</h2>
              <p className="text-sm text-mutedInk">
                {detail.stage.start_year ?? '未定'}–{detail.stage.end_year ?? '未定'} · {cnNumber(detail.stage.poem_count)} 首 · {cnNumber(detail.stage.color_total)} 次颜色
              </p>
            </div>
            <div className="rounded-lg bg-white/45 p-4 text-sm leading-7 text-mutedInk">
              {Object.values(generateStageInterpretation(detail.stage)).filter(Boolean).map((text) => <p key={text}>{text}</p>)}
            </div>
            <div>
              <h3 className="drawer-section-title">主导颜色</h3>
              <div className="flex flex-wrap gap-2">
                {detail.stage.dominant_colors.map((color) => (
                  <span key={color.color} className="rounded-full bg-white/60 px-3 py-1 text-sm">
                    <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: color.hex }} />
                    {color.color} {metricFormat(color.share, 'share')}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="drawer-section-title">和上一阶段相比</h3>
              <ChangeList stage={detail.stage} />
            </div>
            <div>
              <h3 className="drawer-section-title">代表诗句</h3>
              <LinesList lines={detail.stage.sample_lines} max={8} />
            </div>
          </section>
        ) : null}

        {detail.type === 'cell' ? (
          <section className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="h-14 w-14 rounded-lg border border-stone-300" style={{ background: detail.color.hex }} />
              <div>
                <p className="drawer-eyebrow">阶段 × 颜色</p>
                <h2 className="drawer-title">{detail.stage.life_stage_label} × {detail.color.color}</h2>
                <p className="text-sm text-mutedInk">{detail.poet.name} · {detail.color.color_group}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-mutedInk">
              <span className="rounded bg-white/55 p-2">出现次数 {cnNumber(detail.color.count)}</span>
              <span className="rounded bg-white/55 p-2">每首诗 {detail.color.per_poem}</span>
              <span className="rounded bg-white/55 p-2">每千字 {detail.color.per_1000_chars}</span>
              <span className="rounded bg-white/55 p-2">阶段占比 {metricFormat(detail.color.share, 'share')}</span>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white/45 p-3 text-sm leading-7 text-mutedInk">
              <p>时间确定性：{Object.entries(detail.stage.date_certainty_mix).filter(([, count]) => count).map(([key, count]) => `${key} ${count}`).join('；')}</p>
              <p>颜色多义说明：{detail.color.ambiguity_note || '暂无'}</p>
              <p>来源说明：{detail.stage.stage_source_ref}</p>
            </div>
            <div>
              <h3 className="drawer-section-title">相关情绪</h3>
              <p className="text-sm text-mutedInk">{detail.stage.emotions.slice(0, 8).map((item) => item.emotion).join('、') || '暂无'}</p>
            </div>
            <div>
              <h3 className="drawer-section-title">相关场景 / 意象</h3>
              <p className="text-sm text-mutedInk">{detail.stage.scenes.slice(0, 8).map((item) => item.scene).join('、') || '暂无'}</p>
            </div>
            <div>
              <h3 className="drawer-section-title">诗句列表</h3>
              <div className="space-y-3">
                {detail.color.sample_lines.map((line) => (
                  <blockquote key={`${line.poem_id}:${line.line_text}`} className="rounded-lg border-l-4 border-cinnabar/40 bg-white/45 p-3">
                    <p className="font-song text-base leading-7">{line.line_text}</p>
                    <footer className="mt-1 text-xs text-mutedInk">
                      {lineLabel(line)} · {line.date_certainty} · {line.source_ref}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {detail.type === 'event' ? (
          <section className="space-y-5">
            <div>
              <p className="drawer-eyebrow">事件前后对比</p>
              <h2 className="drawer-title">{detail.poet.name} · {detail.event.label}</h2>
              <p className="text-sm text-mutedInk">{detail.event.year} · {detail.event.description}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white/45 p-3 text-sm leading-7 text-mutedInk">
              <p>来源：{detail.event.source_ref}</p>
            </div>
            <div className="grid gap-3">
              {[detail.before, detail.after].filter(Boolean).map((stage) => (
                <div key={stage!.bin_id} className="rounded-lg border border-stone-200 bg-white/45 p-3">
                  <h3 className="font-song text-lg font-semibold">{stage!.life_stage_label}</h3>
                  <p className="text-sm text-mutedInk">Top 颜色：{stage!.dominant_colors.slice(0, 5).map((item) => item.color).join('、') || '暂无'}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {detail.type === 'comparison' ? (
          <section className="space-y-5">
            <div>
              <p className="drawer-eyebrow">跨诗人比较解释</p>
              <h2 className="drawer-title">{detail.poets.map((poet) => poet.name).join(' × ')}</h2>
            </div>
            <p className="rounded-lg bg-white/45 p-4 text-sm leading-7 text-mutedInk">{detail.text}</p>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
