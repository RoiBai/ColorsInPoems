import { createContext, useContext, useMemo, useState } from 'react';
import type { DetailRequest } from '../types';

type AppStateContextValue = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  detail: DetailRequest | null;
  openDetail: (detail: DetailRequest) => void;
  closeDetail: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  selectedDynasty: string;
  setSelectedDynasty: (dynasty: string) => void;
  selectedPoet: string;
  setSelectedPoet: (poet: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedImagery: string;
  setSelectedImagery: (imagery: string) => void;
  selectedEmotion: string;
  setSelectedEmotion: (emotion: string) => void;
  paletteColors: string[];
  setPaletteColors: (colors: string[]) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('poet-color-trajectory');
  const [detail, setDetail] = useState<DetailRequest | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedDynasty, setSelectedDynasty] = useState('全部');
  const [selectedPoet, setSelectedPoet] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImagery, setSelectedImagery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [paletteColors, setPaletteColors] = useState<string[]>([]);

  const openDetail = (next: DetailRequest) => {
    if (next.type === 'color' && next.id) setSelectedColor(next.id);
    if (next.type === 'poet' && next.id) setSelectedPoet(next.id);
    if (next.type === 'imagery' && next.id) setSelectedImagery(next.id);
    if (next.type === 'dynasty' && next.id) setSelectedDynasty(next.id);
    setDetail(next);
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      detail,
      openDetail,
      closeDetail: () => setDetail(null),
      searchOpen,
      setSearchOpen,
      selectedDynasty,
      setSelectedDynasty,
      selectedPoet,
      setSelectedPoet,
      selectedColor,
      setSelectedColor,
      selectedImagery,
      setSelectedImagery,
      selectedEmotion,
      setSelectedEmotion,
      paletteColors,
      setPaletteColors,
    }),
    [activeTab, detail, paletteColors, searchOpen, selectedColor, selectedDynasty, selectedEmotion, selectedImagery, selectedPoet],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
