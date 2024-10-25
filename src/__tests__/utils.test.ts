import { CONTROL_WITH_CONFIG } from '../constants';
import { getControlTreatmentsWithConfig } from '../utils';
import SplitIO from '@splitsoftware/splitio-commons/types/splitio';

describe('getControlTreatmentsWithConfig', () => {

  it('should return an empty object if an empty array is provided', () => {
    expect(Object.values(getControlTreatmentsWithConfig([])).length).toBe(0);
  });

  it('should return an empty object if an empty array is provided', () => {
    const featureFlagNames = ['split1', 'split2'];
    const treatments: SplitIO.TreatmentsWithConfig = getControlTreatmentsWithConfig(featureFlagNames);
    featureFlagNames.forEach((featureFlagName) => {
      expect(treatments[featureFlagName]).toBe(CONTROL_WITH_CONFIG);
    });
    expect(Object.keys(treatments).length).toBe(featureFlagNames.length);
  });

});
