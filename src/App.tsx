import { DetailDrawer } from './components/DetailDrawer';
import { GlobalSearch } from './components/GlobalSearch';
import { Layout } from './components/Layout';
import { AppStateProvider, useAppState } from './state/AppState';
import { ColorMapTab } from './tabs/ColorMapTab';
import { DynastyStreamTab } from './tabs/DynastyStreamTab';
import { ImageryNebulaTab } from './tabs/ImageryNebulaTab';
import { PaletteFinderTab } from './tabs/PaletteFinderTab';
import { PoetColorTrajectoryTab } from './features/poetColorTrajectory/PoetColorTrajectoryTab';
import { PoetPaletteTab } from './tabs/PoetPaletteTab';
import { PolysemyTab } from './tabs/PolysemyTab';

function ActiveTab() {
  const { activeTab } = useAppState();
  if (activeTab === 'poet-color-trajectory') return <PoetColorTrajectoryTab />;
  if (activeTab === 'imagery-nebula') return <ImageryNebulaTab />;
  if (activeTab === 'poet-palette') return <PoetPaletteTab />;
  if (activeTab === 'polysemy') return <PolysemyTab />;
  if (activeTab === 'dynasty-stream') return <DynastyStreamTab />;
  if (activeTab === 'color-map') return <ColorMapTab />;
  if (activeTab === 'palette-finder') return <PaletteFinderTab />;
  return <PoetColorTrajectoryTab />;
}

export default function App() {
  return (
    <AppStateProvider>
      <Layout>
        <ActiveTab />
      </Layout>
      <GlobalSearch />
      <DetailDrawer />
    </AppStateProvider>
  );
}
