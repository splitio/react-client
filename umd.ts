// Split SDK factory (Renamed to avoid name conflict with SplitFactory component)
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';

// HOC functions
import withSplitFactory from './src/withSplitFactory';
import withSplitClient from './src/withSplitClient';
import withSplitTreatments from './src/withSplitTreatments';

// Render props components
import SplitTreatments from './src/SplitTreatments';
import SplitClient from './src/SplitClient';
import SplitFactory from './src/SplitFactory';

// helper functions/hooks
import useClient from './src/useClient';
import useTreatments from './src/useTreatments';
import useTrack from './src/useTrack';
import useManager from './src/useManager';

// SplitContext
import SplitContext from './src/SplitContext';

export default {
  SplitSdk,
  withSplitFactory, withSplitClient, withSplitTreatments,
  SplitFactory, SplitClient, SplitTreatments,
  useClient, useTreatments, useTrack, useManager,
  SplitContext,
};
