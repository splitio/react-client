// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';

// HOC functions
export { withSplitFactory } from './withSplitFactory';
export { withSplitClient } from './withSplitClient';
export { withSplitTreatments } from './withSplitTreatments';

// Render props components
export { SplitTreatments } from './SplitTreatments';
export { SplitClient } from './SplitClient';
export { SplitFactory } from './SplitFactory';

// Hooks
export { useClient } from './useClient';
export { useTreatments } from './useTreatments';
export { useTrack } from './useTrack';
export { useManager } from './useManager';
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
  ISplitFactoryProps,
  ISplitStatus,
  ISplitTreatmentsChildProps,
  ISplitTreatmentsProps,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitTreatmentsOptions,
} from './types';
