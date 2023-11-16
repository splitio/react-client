/** Mocks */
const useSplitManagerMock = jest.fn();
jest.mock('../useSplitManager', () => ({
  useSplitManager: useSplitManagerMock
}));

/** Test target */
import { useManager } from '../useManager';

describe('useManager', () => {

  test('calls useSplitManager with the correct arguments and returns the manager.', () => {
    const manager = 'manager';
    useSplitManagerMock.mockReturnValue({ manager, isReady: false });

    expect(useManager()).toBe(manager);

    expect(useSplitManagerMock).toHaveBeenCalledTimes(1);
  });

});
