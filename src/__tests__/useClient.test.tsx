/** Mocks */
const useSplitClientMock = jest.fn();
jest.mock('../useSplitClient', () => ({
  useSplitClient: useSplitClientMock
}));

/** Test target */
import { useClient } from '../useClient';

describe('useClient', () => {

  test('calls useSplitClient with the correct arguments and returns the client.', () => {
    const attributes = { someAttribute: 'someValue' };
    const client = 'client';
    useSplitClientMock.mockReturnValue({ client, isReady: false });

    expect(useClient('someKey', 'someTrafficType', attributes)).toBe(client);

    expect(useSplitClientMock).toHaveBeenCalledTimes(1);
    expect(useSplitClientMock).toHaveBeenCalledWith({ splitKey: 'someKey', trafficType: 'someTrafficType', attributes });
  });

});
