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

// helper functions/hooks
export { useClient } from './useClient';
export { useTreatments } from './useTreatments';
export { useTrack } from './useTrack';
export { useManager } from './useManager';
export { useSplitClient } from './useSplitClient';
export { useSplitTreatments } from './useSplitTreatments';

// SplitContext
export { SplitContext } from './SplitContext';
