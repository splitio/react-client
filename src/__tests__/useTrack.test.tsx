import React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { useTrack } from '../useTrack';
import { EXCEPTION_NO_SFP } from '../constants';

describe('useTrack', () => {

  const tt = 'user';
  const eventType = 'eventType';
  const value = 10;
  const properties = { prop1: 'prop1' };

  test('returns the track method of the client at Split context updated by SplitFactoryProvider.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let clientTrack;
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          clientTrack = useTrack();
          trackResult = clientTrack(tt, eventType, value, properties);
          return null;
        })}
      </SplitFactoryProvider>,
    );
    const track = outerFactory.client().track as jest.Mock;
    expect(track).toBe(clientTrack);
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method of the client at Split context updated by SplitClient.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let clientTrack;
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' >
          {React.createElement(() => {
            clientTrack = useTrack();
            trackResult = clientTrack(tt, eventType, value, properties);
            return null;
          })}
        </SplitClient>
      </SplitFactoryProvider>
    );
    const track = outerFactory.client('user2').track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method of a new client given a splitKey.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const clientTrack = useTrack('user2');
          trackResult = clientTrack(tt, eventType, value, properties);
          return null;
        })}
      </SplitFactoryProvider>,
    );
    const track = outerFactory.client('user2').track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          const track = useTrack('user2');
          track(tt, eventType, value, properties);
          return null;
        }),
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

});
