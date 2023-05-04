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
import { useManager } from '../useManager';

describe('useManager', () => {

  test('returns the factory manager from the Split context.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let manager;
    render(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          manager = useManager();
          return null;
        })}</SplitFactory>,
    );
    expect(manager).toBe(outerFactory.manager());
  });

  test('returns null if invoked outside Split context.', () => {
    let manager;
    render(
      React.createElement(
        () => {
          manager = useManager();
          return null;
        }),
    );
    expect(manager).toBe(null);
  });

});
