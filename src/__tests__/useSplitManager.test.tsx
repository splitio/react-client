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
import { SplitFactory } from '../SplitFactory';
import { useSplitManager } from '../useSplitManager';

describe('useSplitManager', () => {

  test('returns the factory manager from the Split context.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let hookResult;
    render(
      <SplitFactory factory={outerFactory} >
        {React.createElement(() => {
          hookResult = useSplitManager();
          return null;
        })}
      </SplitFactory>
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
