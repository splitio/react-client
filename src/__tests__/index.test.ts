/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SplitContext as ExportedSplitContext,
  SplitFactory as ExportedSplitFactory,
  SplitFactoryProvider as ExportedSplitFactoryProvider,
  useTrack as exportedUseTrack,
  useSplitClient as exportedUseSplitClient,
  useSplitTreatments as exportedUseSplitTreatments,
  useSplitManager as exportedUseSplitManager,
  // Checks that types are exported. Otherwise, the test would fail with a TS error.
  GetTreatmentsOptions,
  ISplitContextValues,
  ISplitFactoryProviderProps,
  ISplitStatus,
  IUpdateProps,
  IUseSplitClientOptions,
  IUseSplitClientResult,
  IUseSplitTreatmentsOptions,
  IUseSplitTreatmentsResult,
  IUseSplitManagerResult
} from '../index';
import { SplitContext } from '../SplitContext';
import { SplitFactory } from '@splitsoftware/splitio/client';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useTrack } from '../useTrack';
import { useSplitClient } from '../useSplitClient';
import { useSplitTreatments } from '../useSplitTreatments';
import { useSplitManager } from '../useSplitManager';

describe('index', () => {

  test('should export components', () => {
    expect(ExportedSplitFactoryProvider).toBe(SplitFactoryProvider);
  });

  test('should export hooks', () => {
    expect(exportedUseTrack).toBe(useTrack);
    expect(exportedUseSplitClient).toBe(useSplitClient);
    expect(exportedUseSplitTreatments).toBe(useSplitTreatments);
    expect(exportedUseSplitManager).toBe(useSplitManager);
  });

  test('should export SplitContext', () => {
    expect(ExportedSplitContext).toBe(SplitContext);
  });

  test('should export SplitFactory', () => {
    expect(ExportedSplitFactory).toBe(SplitFactory);
  });

});
