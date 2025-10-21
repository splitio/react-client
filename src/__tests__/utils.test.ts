import { CONTROL_WITH_CONFIG } from '../constants';
import { DEFAULT_LOGGER, getControlTreatmentsWithConfig } from '../utils';

describe('getControlTreatmentsWithConfig', () => {

  it('should return an empty object if an empty array is provided', () => {
    expect(Object.values(getControlTreatmentsWithConfig(DEFAULT_LOGGER, [])).length).toBe(0);
  });

  it('should return an empty object if an empty array is provided', () => {
    const featureFlagNames = ['split1', 'split2'];
    const treatments: SplitIO.TreatmentsWithConfig = getControlTreatmentsWithConfig(DEFAULT_LOGGER, featureFlagNames);
    featureFlagNames.forEach((featureFlagName) => {
      expect(treatments[featureFlagName]).toBe(CONTROL_WITH_CONFIG);
    });
    expect(Object.keys(treatments).length).toBe(featureFlagNames.length);
  });

});
