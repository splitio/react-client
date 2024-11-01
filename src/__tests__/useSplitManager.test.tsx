import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { Event, mockSdk } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { getStatus } from '../utils';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useSplitManager } from '../useSplitManager';
import { EXCEPTION_NO_SFP } from '../constants';
import { INITIAL_STATUS } from './testUtils/utils';

describe('useSplitManager', () => {

  test('returns the factory manager from the Split context, and updates on SDK events.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
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
      ...INITIAL_STATUS,
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

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useSplitManager();
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

});
