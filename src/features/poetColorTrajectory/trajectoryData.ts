import { useData } from '../../hooks/useData';
import type { PoetColorTrajectoryData } from './trajectoryTypes';

export function usePoetColorTrajectoryData() {
  return useData<PoetColorTrajectoryData>('/data/stats/poet_color_trajectory.json');
}
