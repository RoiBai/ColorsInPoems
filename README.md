# 中国古代诗歌颜色分析

一个基于 React + TypeScript + Vite + Tailwind CSS 的数字人文交互网站，用真实处理后的古典诗词语料探索“颜色—诗人—诗句—意象—情绪—朝代”的关系。

页面保留参考站点的三个核心 Tab：

- 诗人色彩关联
- 朝代流行度
- 色彩意象关联

并新增意象色彩星云、诗人调色盘、诗句显色阅读器、一色多义、朝代色彩河流、色彩地图、诗歌色卡墙、调色找诗、情绪色谱、三角关系图、诗句漂浮和猜诗小游戏。

新增研究型重点模块：

- 诗人色彩轨迹：以诗人生平为时间轴，分析 poet × time × color × emotion / scene 的阶段性变化。

## 本地运行

```bash
npm install
npm run data:all
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173
```

生产构建：

```bash
npm run build
npm run preview
```

## 数据下载

下载脚本：

```bash
npm run data:download
```

脚本会优先下载公开开源语料：

- chinese-poetry / chinese-poetry
- GitHub: https://github.com/chinese-poetry/chinese-poetry
- 许可：MIT License
- 当前下载样本包括全唐诗、宋诗、宋词的部分 JSON 文件

如果网络不可用，脚本会优先复用 `data/raw/` 中已有的合法下载缓存；若没有缓存，再使用 `data/seed/seed_poems.json` 中的公版古典诗词种子语料，保证流程可离线复现。

下载结果保存到：

- `data/raw/`
- `data/source_manifest.json`
- `public/data/source_manifest.json`

## 数据处理流程

完整流程：

```bash
npm run data:all
```

分步命令：

```bash
npm run data:download
npm run data:normalize
npm run data:extract
npm run data:build
npm run data:biography
npm run data:assign-time
npm run data:trajectory
```

脚本说明：

- `scripts/download-corpus.js`：下载或读取公开语料，生成来源 manifest。
- `scripts/normalize-corpus.js`：统一成 `Poem` 结构，清洗文本、切分诗句、去重。
- `scripts/extract-colors.js`：基于颜色词典最长匹配，输出颜色出现。
- `scripts/extract-imagery.js`：在颜色词前后 8 字优先抽取意象词。
- `scripts/extract-emotions.js`：用规则词典为诗句标注情绪标签。
- `scripts/build-stats.js`：生成图表预聚合统计。
- `scripts/build-poet-biography.js`：读取 `data/poet_biographies.seed.json`，校验并输出诗人生平阶段数据。
- `scripts/assign-poem-time.js`：读取 `poems.json` 和 `data/poem_time_overrides.seed.json`，生成带时间确定性的 `poems_timed.json`。
- `scripts/build-poet-color-trajectory.js`：聚合诗人阶段色彩、情绪、场景、主导色迁移和自动解释文本。

主要输出：

- `public/data/poems.json`
- `public/data/color_occurrences.json`
- `public/data/imagery_occurrences.json`
- `public/data/emotion_occurrences.json`
- `public/data/stats/*.json`
- `public/data/poet_biographies.json`
- `public/data/poems_timed.json`
- `public/data/stats/poet_color_trajectory.json`

## 诗人色彩轨迹

“诗人色彩轨迹”Tab 将分析单位从单个颜色词扩展为：

```text
poet × time × color × emotion / scene
```

该模块包含：

- 诗人时间轴色彩热力图
- 主导色迁移轨迹
- 颜色—情绪 / 场景矩阵
- 人生阶段与关键事件导航
- 阶段 × 颜色详情抽屉
- 跨诗人轨迹比较

时间不确定性显式保留：

- `exact`：确切年份
- `estimated`：估计年份
- `range`：年份范围
- `stage`：仅可归入人生阶段
- `unknown`：未定年

当前项目没有完整学术年谱数据库，因此 `data/poet_biographies.seed.json` 和 `data/poem_time_overrides.seed.json` 是最小可用研究 seed。所有人工阶段和定年映射都保留 `source_ref`，正式论文使用前应据专门年谱和版本文献校订。无法定位的诗作不会被强行放入时间轴，而是进入“未定年”集合。

文本规范：下载语料在 `normalize-corpus` 阶段统一转为简体中文，避免界面中混用繁体标题和诗句。

## 颜色词典

颜色词典位于：

```text
data/color_lexicon.json
```

每个词条包含：

- `color_word`
- `normalized_name`
- `color_group`
- `hex`
- `aliases`
- `ambiguity_note`

已覆盖红系、橙黄系、绿系、蓝青系、紫系、中性色等常见古典颜色词。HEX 色值只作为可视化近似，不代表古代颜色标准的唯一解释。

新增颜色词时，在 `data/color_lexicon.json` 添加词条后重新运行：

```bash
npm run data:extract
npm run data:build
```

## 意象和情绪规则

意象规则位于 `scripts/extract-imagery.js`，类别包括：

- 自然
- 植物
- 动物
- 季节
- 人物
- 器物
- 空间
- 时间

情绪规则位于 `scripts/extract-emotions.js`，标签包括：

- 自然、清新、相思、孤独、离愁、忧郁、壮美、爱国
- 喜庆、禅意、怀古、思乡、高洁、柔美、豪放、悲凉

这些标签是规则推断，不等同于文学定论。

## 图表说明

- 诗人色彩关联：左列诗人，右列色彩，连线表示使用关系，权重来自颜色出现次数。
- 朝代流行度：按朝代展示 Top 10 色彩词，可切换原始次数和每千首归一化频率。
- 色彩意象关联：气泡大小表示关联诗词数量，颜色取该意象最常见色彩词。
- 意象色彩星云：hover 意象后放射展开关联颜色。
- 诗人调色盘：用色卡面积表示诗人颜色频率，并支持诗人对比。
- 诗句显色阅读器：在诗歌正文中高亮颜色词。
- 一色多义：自动聚合颜色 × 意象 × 情绪语义场景。
- 朝代色彩河流：streamgraph 展示颜色随朝代变化趋势。
- 色彩地图：颜色 → 意象 → 诗句三层探索。
- 诗歌色卡墙：每首诗转换为颜色顺序色带。
- 调色找诗：用户选择颜色组合后返回匹配诗句。
- 情绪色谱：从情绪进入颜色、意象和诗句。
- 三角关系图：联动诗人、颜色、情绪。
- 诗句漂浮：艺术化颜色频次与诗句碎片探索。
- 猜诗小游戏：基于真实统计生成题目。
- 诗人色彩轨迹：沿诗人生平阶段观察颜色、情绪、场景和主导色迁移，并支持跨诗人比较。

## 如何新增语料来源

1. 在 `scripts/download-corpus.js` 的 `remoteSources` 中添加来源。
2. 确保来源为公版或明确开源授权文本。
3. 在 manifest 中记录：
   - `source_id`
   - `source_name`
   - `url`
   - `license`
   - `dynasty_coverage`
   - `downloaded_at`
   - `file_paths`
4. 如果数据结构不是 chinese-poetry 风格，在 `scripts/normalize-corpus.js` 增加解析分支。
5. 运行 `npm run data:all`。

## 局限性

- 颜色词可能有多义性，例如“青”“苍”“玄”“黛”。
- 单字颜色可能误判，脚本会记录上下文与 `ambiguity_flag` 方便人工复核。
- 情绪标签来自规则词典，不代表确定的文学解释。
- 意象抽取使用规则匹配，不是机器学习模型。
- 当前下载的是 chinese-poetry 的部分样本文件；可通过 manifest 扩展更多来源。
- “一键生成诗卡”当前提供可复制文本卡片，PNG 导出可后续接入 `html-to-image`。
- 诗人色彩轨迹中的生平阶段和部分定年来自 seed 数据，适合研究工具原型和探索，不应直接当作最终文学史结论。
