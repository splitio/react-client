// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory } from '@splitsoftware/splitio/client';

// Provider Component
export { SplitFactoryProvider } from './SplitFactoryProvider';

// Hooks
export { useTrack } from './useTrack';
export { useSplitClient } from './useSplitClient';
export { useSplitTreatments } from './useSplitTreatments';
export { useSplitManager } from './useSplitManager';

// SplitContext
export { SplitContext } from './SplitContext';

// Types
export type {
  GetTreatmentsOptions,
  ISplitContextValues,
  ISplitFactoryProviderProps,
  ISplitStatus,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitClientResult,
  IUseSplitTreatmentsOptions,
  IUseSplitTreatmentsResult,
  IUseSplitManagerResult
} from './types';
