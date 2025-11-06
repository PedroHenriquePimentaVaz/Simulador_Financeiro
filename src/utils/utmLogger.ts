export type UtmEventType =
  | 'utmCaptured'
  | 'utmStored'
  | 'utmMissing'
  | 'webhookPayload'
  | 'webhookSuccess'
  | 'webhookError'
  | 'webhookFallback'
  | 'simulationHistorySaved';

interface UtmEventPayload {
  context?: string;
  url?: string;
  params?: Record<string, string>;
  data?: unknown;
  status?: number;
  message?: string;
}

interface StoredUtmEvent {
  id: string;
  type: UtmEventType;
  timestamp: string;
  payload: UtmEventPayload;
}

const UTM_EVENT_STORAGE_KEY = 'utm_event_log';
const SIMULATION_HISTORY_KEY = 'simulation_history';

const persistEvent = (event: StoredUtmEvent) => {
  try {
    const raw = localStorage.getItem(UTM_EVENT_STORAGE_KEY);
    const events: StoredUtmEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    // Keep only the latest 200 events to avoid unbounded growth
    const trimmed = events.slice(-200);
    localStorage.setItem(UTM_EVENT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('utmLogger: falha ao persistir evento', error);
  }
};

export const recordUtmEvent = (type: UtmEventType, payload: UtmEventPayload = {}) => {
  const event: StoredUtmEvent = {
    id: `${type}-${Date.now()}`,
    type,
    timestamp: new Date().toISOString(),
    payload,
  };

  persistEvent(event);
};

export interface SimulationHistoryEntry {
  id: string;
  timestamp: string;
  url: string;
  simulation: Record<string, unknown>;
  utmParams: Record<string, string>;
  webhookStatus?: number;
  webhookOk?: boolean;
}

export const saveSimulationHistory = (entry: SimulationHistoryEntry) => {
  try {
    const raw = localStorage.getItem(SIMULATION_HISTORY_KEY);
    const history: SimulationHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.push(entry);
    const trimmed = history.slice(-100);
    localStorage.setItem(SIMULATION_HISTORY_KEY, JSON.stringify(trimmed));
    recordUtmEvent('simulationHistorySaved', {
      context: 'localStorage',
      params: entry.utmParams,
      status: entry.webhookStatus,
    });
  } catch (error) {
    console.warn('utmLogger: falha ao salvar histórico de simulações', error);
  }
};

export const getStoredUtmEvents = (): StoredUtmEvent[] => {
  try {
    const raw = localStorage.getItem(UTM_EVENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('utmLogger: falha ao recuperar eventos', error);
    return [];
  }
};

export const getSimulationHistory = (): SimulationHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(SIMULATION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('utmLogger: falha ao recuperar histórico de simulações', error);
    return [];
  }
};
