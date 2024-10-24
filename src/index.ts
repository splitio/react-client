// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory } from '@splitsoftware/splitio/client';

// Components
export { SplitTreatments } from './SplitTreatments';
export { SplitClient } from './SplitClient';
export { SplitFactoryProvider } from './SplitFactoryProvider';

// Hooks
export { useTrack } from './useTrack';
export { useSplitClient } from './useSplitClient';
export { useSplitTreatments } from './useSplitTreatments';
export { useSplitManager } from './useSplitManager';
export { useSplitContext } from './SplitContext';

// Types
export type {
  GetTreatmentsOptions,
  ISplitClientChildProps,
  ISplitClientProps,
  ISplitContextValues,
  ISplitFactoryProviderChildProps,
  ISplitFactoryProviderProps,
  ISplitStatus,
  ISplitTreatmentsChildProps,
  ISplitTreatmentsProps,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitTreatmentsOptions
} from './types';
