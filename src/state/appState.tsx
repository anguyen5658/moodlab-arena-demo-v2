import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ArenaTabId, ArenaZoneId } from '../data/arena';

export interface AppState {
  tab: ArenaTabId;
  zone: ArenaZoneId;
  selectedGameId: string | null;
  coins: number;
  xp: number;
}

type AppAction =
  | { type: 'setTab'; tab: ArenaTabId }
  | { type: 'setZone'; zone: ArenaZoneId }
  | { type: 'setSelectedGameId'; selectedGameId: string | null }
  | { type: 'award'; coins: number; xp: number };

const initialState: AppState = {
  tab: 'arena',
  zone: 'hub',
  selectedGameId: null,
  coins: 0,
  xp: 0,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'setZone':
      return { ...state, zone: action.zone, selectedGameId: null };
    case 'setSelectedGameId':
      return { ...state, selectedGameId: action.selectedGameId };
    case 'award':
      return { ...state, coins: state.coins + action.coins, xp: state.xp + action.xp };
    default:
      return state;
  }
}

interface AppStateContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}

export const appActions = {
  setTab: (tab: ArenaTabId) => ({ type: 'setTab' as const, tab }),
  setZone: (zone: ArenaZoneId) => ({ type: 'setZone' as const, zone }),
  setSelectedGameId: (selectedGameId: string | null) => ({ type: 'setSelectedGameId' as const, selectedGameId }),
  award: (coins: number, xp: number) => ({ type: 'award' as const, coins, xp }),
};