/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SplitFactory as ExportedSplitFactory,
  SplitFactoryProvider as ExportedSplitFactoryProvider,
  SplitClient as ExportedSplitClient,
  SplitTreatments as ExportedSplitTreatments,
  useTrack as exportedUseTrack,
  useSplitClient as exportedUseSplitClient,
  useSplitTreatments as exportedUseSplitTreatments,
  useSplitManager as exportedUseSplitManager,
  useSplitContext as exportedUseSplitContext,
  // Checks that types are exported. Otherwise, the test would fail with a TS error.
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
  IUseSplitTreatmentsOptions,
} from '../index';
import { SplitFactory } from '@splitsoftware/splitio/client';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { SplitTreatments } from '../SplitTreatments';
import { useTrack } from '../useTrack';
import { useSplitClient } from '../useSplitClient';
import { useSplitTreatments } from '../useSplitTreatments';
import { useSplitManager } from '../useSplitManager';
import { useSplitContext } from '../SplitContext';

describe('index', () => {

  it('should export components', () => {
    expect(ExportedSplitFactoryProvider).toBe(SplitFactoryProvider);
    expect(ExportedSplitClient).toBe(SplitClient);
    expect(ExportedSplitTreatments).toBe(SplitTreatments);
  });

  it('should export hooks', () => {
    expect(exportedUseTrack).toBe(useTrack);
    expect(exportedUseSplitClient).toBe(useSplitClient);
    expect(exportedUseSplitTreatments).toBe(useSplitTreatments);
    expect(exportedUseSplitManager).toBe(useSplitManager);
    expect(exportedUseSplitContext).toBe(useSplitContext);
  });

  it('should export SplitFactory', () => {
    expect(ExportedSplitFactory).toBe(SplitFactory);
  });

});
