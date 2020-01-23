import { getControlTreatmentsWithConfig, CONTROL_WITH_CONFIG } from '../constants';
import { TreatmentsWithConfig } from '@splitsoftware/splitio/types/splitio';

describe('getControlTreatmentsWithConfig', () => {

  it('should return an empty object if an empty array is provided', () => {
    expect(Object.values(getControlTreatmentsWithConfig([])).length).toBe(0);
  });

  it('should return an empty object if an empty array is provided', () => {
    const splitNames = ['split1', 'split2'];
    const treatments: TreatmentsWithConfig = getControlTreatmentsWithConfig(splitNames);
    splitNames.forEach((splitName) => {
      expect(treatments[splitName]).toBe(CONTROL_WITH_CONFIG);
    });
    expect(Object.keys(treatments).length).toBe(splitNames.length);
  });

});
