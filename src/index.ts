// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
export { SplitFactory as SplitSdk } from '@splitsoftware/splitio';

// HOC functions
export { default as withSplitFactory } from './withSplitFactory';
export { default as withSplitClient } from './withSplitClient';
export { default as withSplitTreatments } from './withSplitTreatments';

// Render props components
export { default as SplitTreatments } from './SplitTreatments';
export { default as SplitClient } from './SplitClient';
export { default as SplitFactory } from './SplitFactory';

// helper functions/hooks
export { default as useClient} from './useClient';
export { default as useTreatments} from './useTreatments';
export { default as useTrack} from './useTrack';
export { default as useManager} from './useManager';
