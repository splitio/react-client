import React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { useTrack } from '../useTrack';

describe('useTrack', () => {

  const tt = 'user';
  const eventType = 'eventType';
  const value = 10;
  const properties = { prop1: 'prop1' };

  test('returns the track method bound to the client at Split context updated by SplitFactoryProvider.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let boundTrack;
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          boundTrack = useTrack();
          trackResult = boundTrack(tt, eventType, value, properties);
          return null;
        })}
      </SplitFactoryProvider>,
    );
    const track = outerFactory.client().track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method bound to the client at Split context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let boundTrack;
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' >
          {React.createElement(() => {
            boundTrack = useTrack();
            trackResult = boundTrack(tt, eventType, value, properties);
            return null;
          })}
        </SplitClient>
      </SplitFactoryProvider>
    );
    const track = outerFactory.client('user2').track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method bound to a new client given a splitKey and optional trafficType.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let boundTrack;
    let trackResult;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          boundTrack = useTrack('user2', tt);
          trackResult = boundTrack(eventType, value, properties);
          return null;
        })}
      </SplitFactoryProvider>,
    );
    const track = outerFactory.client('user2', tt).track as jest.Mock;
    expect(track).toBeCalledWith(eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  // THE FOLLOWING TEST WILL PROBABLE BE CHANGED BY 'return a null value or throw an error if it is not inside an SplitProvider'
  test('returns a false function (`() => false`) if invoked outside Split context.', () => {
    let trackResult;
    render(
      React.createElement(() => {
        const track = useTrack('user2', tt);
        trackResult = track(eventType, value, properties);
        return null;
      }),
    );
    expect(trackResult).toBe(false);
  });

});
