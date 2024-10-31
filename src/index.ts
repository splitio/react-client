// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory } from '@splitsoftware/splitio/client';

// Components
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
  IUseSplitTreatmentsResult,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitTreatmentsOptions
} from './types';
