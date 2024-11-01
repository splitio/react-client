/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SplitContext as ExportedSplitContext,
  SplitFactory as ExportedSplitFactory,
  SplitFactoryProvider as ExportedSplitFactoryProvider,
  SplitClient as ExportedSplitClient,
  SplitTreatments as ExportedSplitTreatments,
  withSplitFactory as exportedWithSplitFactory,
  withSplitClient as exportedWithSplitClient,
  withSplitTreatments as exportedWithSplitTreatments,
  useTrack as exportedUseTrack,
  useSplitClient as exportedUseSplitClient,
  useSplitTreatments as exportedUseSplitTreatments,
  useSplitManager as exportedUseSplitManager,
  // Checks that types are exported. Otherwise, the test would fail with a TS error.
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
} from '../index';
import { SplitContext } from '../SplitContext';
import { SplitFactory } from '@splitsoftware/splitio/client';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { SplitTreatments } from '../SplitTreatments';
import { withSplitFactory } from '../withSplitFactory';
import { withSplitClient } from '../withSplitClient';
import { withSplitTreatments } from '../withSplitTreatments';
import { useTrack } from '../useTrack';
import { useSplitClient } from '../useSplitClient';
import { useSplitTreatments } from '../useSplitTreatments';
import { useSplitManager } from '../useSplitManager';

describe('index', () => {

  it('should export components', () => {
    expect(ExportedSplitFactoryProvider).toBe(SplitFactoryProvider);
    expect(ExportedSplitClient).toBe(SplitClient);
    expect(ExportedSplitTreatments).toBe(SplitTreatments);
  });

  it('should export HOCs', () => {
    expect(exportedWithSplitFactory).toBe(withSplitFactory);
    expect(exportedWithSplitClient).toBe(withSplitClient);
    expect(exportedWithSplitTreatments).toBe(withSplitTreatments);
  });

  it('should export hooks', () => {
    expect(exportedUseTrack).toBe(useTrack);
    expect(exportedUseSplitClient).toBe(useSplitClient);
    expect(exportedUseSplitTreatments).toBe(useSplitTreatments);
    expect(exportedUseSplitManager).toBe(useSplitManager);
  });

  it('should export SplitContext', () => {
    expect(ExportedSplitContext).toBe(SplitContext);
  });

  it('should export SplitFactory', () => {
    expect(ExportedSplitFactory).toBe(SplitFactory);
  });

});
