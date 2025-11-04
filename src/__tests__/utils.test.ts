import { CONTROL, CONTROL_WITH_CONFIG } from '../constants';
import { getControlTreatments } from '../utils';

describe('getControlTreatments', () => {

  it('should return an empty object if an empty array is provided', () => {
    expect(Object.values(getControlTreatments([], true)).length).toBe(0);
    expect(Object.values(getControlTreatments([], false)).length).toBe(0);
  });

  it('should return an object with control treatments if an array of feature flag names is provided', () => {
    const featureFlagNames = ['split1', 'split2'];
    const treatmentsWithConfig: SplitIO.TreatmentsWithConfig = getControlTreatments(featureFlagNames, true);
    featureFlagNames.forEach((featureFlagName) => {
      expect(treatmentsWithConfig[featureFlagName]).toBe(CONTROL_WITH_CONFIG);
    });
    expect(Object.keys(treatmentsWithConfig).length).toBe(featureFlagNames.length);

    const treatments: SplitIO.Treatments = getControlTreatments(featureFlagNames, false);
    featureFlagNames.forEach((featureFlagName) => {
      expect(treatments[featureFlagName]).toBe(CONTROL);
    });
    expect(Object.keys(treatments).length).toBe(featureFlagNames.length);
  });

});
