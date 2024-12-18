// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory } from '@splitsoftware/splitio/client';

// HOC functions
export { withSplitFactory } from './withSplitFactory';
export { withSplitClient } from './withSplitClient';
export { withSplitTreatments } from './withSplitTreatments';

// Components
export { SplitTreatments } from './SplitTreatments';
export { SplitClient } from './SplitClient';
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
  ISplitClientChildProps,
  ISplitClientProps,
  ISplitContextValues,
  ISplitFactoryChildProps,
  ISplitFactoryProviderProps,
  ISplitStatus,
  ISplitTreatmentsChildProps,
  ISplitTreatmentsProps,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitTreatmentsOptions,
  IUseSplitManagerResult
} from './types';
