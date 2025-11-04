import { CONTROL, CONTROL_WITH_CONFIG } from '../constants';
import { getTreatments, getTreatment } from '../utils';
import { sdkBrowserWithConfig } from './testUtils/sdkConfigs';

const factoryWithoutFallbacks = {
  settings: {}
} as SplitIO.IBrowserSDK;

const factoryWithFallbacks = {
  settings: sdkBrowserWithConfig
} as SplitIO.IBrowserSDK

describe('getTreatments', () => {

  it('should return an empty object if an empty array is provided', () => {
    expect(getTreatments([], true)).toEqual({});
    expect(getTreatments([], false)).toEqual({});
  });

  it('should return an object with control treatments if an array of feature flag names is provided', () => {
    const featureFlagNames = ['split1', 'split2'];
    const treatmentsWithConfig: SplitIO.TreatmentsWithConfig = getTreatments(featureFlagNames, true);
    expect(treatmentsWithConfig).toEqual({ 'split1': CONTROL_WITH_CONFIG, 'split2': CONTROL_WITH_CONFIG });

    const treatments: SplitIO.Treatments = getTreatments(featureFlagNames, false);
    expect(treatments).toEqual({ 'split1': CONTROL, 'split2': CONTROL });

    expect(getTreatments(featureFlagNames, true, factoryWithoutFallbacks)).toEqual({ 'split1': CONTROL_WITH_CONFIG, 'split2': CONTROL_WITH_CONFIG });
    expect(getTreatments(featureFlagNames, false, factoryWithoutFallbacks)).toEqual({ 'split1': CONTROL, 'split2': CONTROL });
  });

  it('should return an object with fallback or control treatments if an array of feature flag names and factory are provided', () => {
    const featureFlagNames = ['split1', 'ff1'];
    const treatmentsWithConfig: SplitIO.TreatmentsWithConfig = getTreatments(featureFlagNames, true, factoryWithFallbacks);
    expect(treatmentsWithConfig).toEqual({ 'split1': { treatment: 'control_global', config: null }, 'ff1': { treatment: 'control_ff1', config: 'control_ff1_config' } });

    const treatments: SplitIO.Treatments = getTreatments(featureFlagNames, false, factoryWithFallbacks);
    expect(treatments).toEqual({ 'split1': 'control_global', 'ff1': 'control_ff1' });
  });

});

describe('getTreatment', () => {

  it('should return control treatments', () => {
    expect(getTreatment('any', true)).toEqual(CONTROL_WITH_CONFIG);
    expect(getTreatment('any', false)).toEqual(CONTROL);

    expect(getTreatment('any', true, factoryWithoutFallbacks)).toEqual(CONTROL_WITH_CONFIG);
    expect(getTreatment('any', false, factoryWithoutFallbacks)).toEqual(CONTROL);
  });

  it('should return fallback treatments if a factory with fallback treatments is provided', () => {
    const treatmentWithConfig: SplitIO.TreatmentWithConfig = getTreatment('split1', true, factoryWithFallbacks);
    expect(treatmentWithConfig).toEqual({ treatment: 'control_global', config: null });

    const treatment: SplitIO.Treatment = getTreatment('ff1', false, factoryWithFallbacks);
    expect(treatment).toEqual('control_ff1' );
  });

});
