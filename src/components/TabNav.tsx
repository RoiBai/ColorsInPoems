import { useAppState } from '../state/AppState';

export const tabs = [
  { id: 'poet-color-trajectory', label: '诗人色彩轨迹' },
  { id: 'imagery-nebula', label: '意象色彩星云' },
  { id: 'poet-palette', label: '诗人调色盘' },
  { id: 'polysemy', label: '一色多义' },
  { id: 'dynasty-stream', label: '朝代色彩河流' },
  { id: 'color-map', label: '色彩地图' },
  { id: 'palette-finder', label: '调色找诗' },
];

export function TabNav() {
  const { activeTab, setActiveTab } = useAppState();
  return (
    <nav aria-label="图表标签页" className="sticky top-0 z-20 -mx-4 overflow-x-auto border-y border-stone-200/80 bg-paper/92 px-4 py-3 backdrop-blur md:mx-0 md:rounded-full md:border md:px-3">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-label={`切换到${tab.label}`}
            aria-pressed={activeTab === tab.id}
            className={`pill-button ${activeTab === tab.id ? 'pill-button-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
