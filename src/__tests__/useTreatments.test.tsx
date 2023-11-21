/** Mocks */
const useSplitTreatmentsMock = jest.fn();
jest.mock('../useSplitTreatments', () => ({
  useSplitTreatments: useSplitTreatmentsMock
}));

/** Test target */
import { useTreatments } from '../useTreatments';

// @TODO validate that useTreatments re-render when the client is ready and updated.
describe('useTreatments', () => {

  test('calls useSplitTreatments with the correct arguments and returns the treatments.', () => {
    const names = ['someFeature'];
    const attributes = { someAttribute: 'someValue' };
    const treatments = { someFeature: { treatment: 'on', config: null } };
    useSplitTreatmentsMock.mockReturnValue({ treatments, isReady: false });

    expect(useTreatments(names, attributes, 'someKey')).toBe(treatments);

    expect(useSplitTreatmentsMock).toHaveBeenCalledTimes(1);
    expect(useSplitTreatmentsMock).toHaveBeenCalledWith({ names, attributes, splitKey: 'someKey' });
  });

});
