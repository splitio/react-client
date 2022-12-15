import {
  SplitContext as ExportedSplitContext,
  SplitSdk as ExportedSplitSdk,
  SplitFactory as ExportedSplitFactory,
  SplitClient as ExportedSplitClient,
  SplitTreatments as ExportedSplitTreatments,
  withSplitFactory as exportedWithSplitFactory,
  withSplitClient as exportedWithSplitClient,
  withSplitTreatments as exportedWithSplitTreatments,
  useClient as exportedUseClient,
  useManager as exportedUseManager,
  useTrack as exportedUseTrack,
  useTreatments as exportedUseTreatments,
} from '../index';
import SplitContext from '../SplitContext';
import { SplitFactory as SplitioEntrypoint } from '@splitsoftware/splitio/client';
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import SplitTreatments from '../SplitTreatments';
import withSplitFactory from '../withSplitFactory';
import withSplitClient from '../withSplitClient';
import withSplitTreatments from '../withSplitTreatments';
import useClient from '../useClient';
import useManager from '../useManager';
import useTrack from '../useTrack';
import useTreatments from '../useTreatments';

describe('index', () => {

  it('should export components', () => {
    expect(ExportedSplitFactory).toBe(SplitFactory);
    expect(ExportedSplitClient).toBe(SplitClient);
    expect(ExportedSplitTreatments).toBe(SplitTreatments);
  });

  it('should export HOCs', () => {
    expect(exportedWithSplitFactory).toBe(withSplitFactory);
    expect(exportedWithSplitClient).toBe(withSplitClient);
    expect(exportedWithSplitTreatments).toBe(withSplitTreatments);
  });

  it('should export hooks', () => {
    expect(exportedUseClient).toBe(useClient);
    expect(exportedUseManager).toBe(useManager);
    expect(exportedUseTrack).toBe(useTrack);
    expect(exportedUseTreatments).toBe(useTreatments);
  });

  it('should export SplitContext', () => {
    expect(ExportedSplitContext).toBe(SplitContext);
  });

  it('should export Splitio entrypoint', () => {
    expect(ExportedSplitSdk).toBe(SplitioEntrypoint);
  });

});
