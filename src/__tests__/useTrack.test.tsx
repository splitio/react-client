import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event, getLastInstance } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { useTrack } from '../useTrack';
import { useSplitClient } from '../useSplitClient';
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

  test('returns the track method of the client at Split context updated by SplitFactoryProvider (config prop).', () => {
    let splitKey: string | undefined = undefined;
    render(
      <SplitFactoryProvider config={sdkBrowser} updateOnSdkUpdate={true} >
        {React.createElement(() => {
          const clientTrack = useTrack(splitKey);

          const { client } = useSplitClient({ splitKey });
          expect(clientTrack).toBe(client!.track);

          clientTrack(tt, eventType, value, properties);

          useEffect(() => {
            clientTrack(tt, eventType, value, properties);
          }, [clientTrack]);
          return null;
        })}
      </SplitFactoryProvider>,
    );

    act(() => getLastInstance(SplitFactory).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => getLastInstance(SplitFactory).client().__emitter__.emit(Event.SDK_READY));
    splitKey = 'user2'; // `clientTrack` dependency changed
    act(() => getLastInstance(SplitFactory).client().__emitter__.emit(Event.SDK_UPDATE));

    let track = getLastInstance(SplitFactory).client().track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toBeCalledTimes(4); // 3 from render + 1 from useEffect

    track = getLastInstance(SplitFactory).client('user2').track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toBeCalledTimes(2); // 1 from render + 1 from useEffect (`clientTrack` dependency changed)
  });

});
