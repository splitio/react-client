import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { Event, mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { getStatus } from '../utils';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useSplitManager } from '../useSplitManager';

describe('useSplitManager', () => {

  test('returns the factory manager from the Split context, and updates when the context changes.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let hookResult;
    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          hookResult = useSplitManager();
          return null;
        })}
      </SplitFactoryProvider>
    );

    expect(hookResult).toStrictEqual({
      manager: outerFactory.manager(),
      client: outerFactory.client(),
      factory: outerFactory,
      hasTimedout: false,
      isDestroyed: false,
      isReady: false,
      isReadyFromCache: false,
      isTimedout: false,
      lastUpdate: 0,
    });

    act(() => (outerFactory.client() as any).__emitter__.emit(Event.SDK_READY));

    expect(hookResult).toStrictEqual({
      manager: outerFactory.manager(),
      client: outerFactory.client(),
      factory: outerFactory,
      hasTimedout: false,
      isDestroyed: false,
      isReady: true,
      isReadyFromCache: false,
      isTimedout: false,
      lastUpdate: getStatus(outerFactory.client()).lastUpdate,
    });
  });

  test('returns null if invoked outside Split context.', () => {
    let hookResult;
    render(
      React.createElement(() => {
        hookResult = useSplitManager();
        return null;
      })
    );

    expect(hookResult).toStrictEqual({
      manager: null,
      client: null,
      factory: null,
      hasTimedout: false,
      isDestroyed: false,
      isReady: false,
      isReadyFromCache: false,
      isTimedout: false,
      lastUpdate: 0,
    });
  });

});
