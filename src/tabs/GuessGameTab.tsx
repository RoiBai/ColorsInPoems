import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { LoadingBlock } from '../components/Loading';
import { useData } from '../hooks/useData';
import { LinesList, SectionHeader } from './common';
import type { SampleLine } from '../types';

type Question = {
  type: 'poet' | 'dynasty' | 'emotion';
  answer: string;
  prompt_colors: string[];
  prompt_imageries?: string[];
  options: string[];
  explanation: SampleLine[];
};

const typeName = {
  poet: '猜诗人',
  dynasty: '猜朝代',
  emotion: '猜情绪',
};

export function GuessGameTab() {
  const { data, loading } = useData<Question[]>('/data/stats/game_questions.json');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setBest(Number(window.localStorage.getItem('poem-color-best') || 0));
  }, []);
  useEffect(() => {
    if (score > best) {
      setBest(score);
      window.localStorage.setItem('poem-color-best', String(score));
    }
  }, [best, score]);

  const question = data?.[index % (data.length || 1)];
  const options = useMemo(() => [...new Set(question?.options || [])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')), [question]);
  const answered = Boolean(choice);
  const correct = choice === question?.answer;

  if (loading) return <LoadingBlock label="正在生成猜诗小游戏题目" />;
  if (!data?.length || !question) return <EmptyState message="暂无可用题目。" />;

  return (
    <section className="panel p-4 md:p-6">
      <SectionHeader title="猜诗小游戏" description="题目自动从真实统计数据生成：猜诗人、猜朝代、猜情绪。答完显示统计解释与代表诗句。" />
      <div className="mb-4 flex flex-wrap gap-2 text-sm text-mutedInk">
        <span className="rounded-full bg-white/60 px-3 py-1">当前分数 {score}</span>
        <span className="rounded-full bg-white/60 px-3 py-1">本地最高分 {best}</span>
        <span className="rounded-full bg-cinnabar/10 px-3 py-1 text-cinnabar">{typeName[question.type]}</span>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white/45 p-5">
        <p className="text-sm text-mutedInk">这组颜色{question.prompt_imageries?.length ? '和意象' : ''}更像哪一个答案？</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {question.prompt_colors.map((color) => <span key={color} className="rounded-full bg-paperDeep px-4 py-2 font-song text-lg">{color}</span>)}
          {question.prompt_imageries?.map((imagery) => <span key={imagery} className="rounded-full bg-white/70 px-4 py-2 font-song text-lg">{imagery}</span>)}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {options.map((option) => (
            <button
              key={option}
              disabled={answered}
              className={`rounded-lg border p-4 text-left font-song text-xl transition ${
                answered && option === question.answer
                  ? 'border-celadon bg-celadon/20'
                  : answered && option === choice
                    ? 'border-cinnabar bg-cinnabar/12'
                    : 'border-stone-200 bg-white/55 hover:border-cinnabar/50'
              }`}
              onClick={() => {
                setChoice(option);
                if (option === question.answer) setScore((value) => value + 1);
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {answered ? (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white/50 p-4">
            <h3 className="font-song text-xl font-semibold">{correct ? '回答正确' : `答案是：${question.answer}`}</h3>
            <p className="mt-1 text-sm text-mutedInk">解释来自该组颜色在统计中更常见的诗人、朝代或情绪分布。</p>
            <div className="mt-3"><LinesList lines={question.explanation || []} max={3} /></div>
            <button
              className="soft-button mt-4"
              onClick={() => {
                setIndex((value) => value + 1);
                setChoice('');
              }}
            >
              下一题
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
