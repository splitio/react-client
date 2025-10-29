import * as React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { SplitClient } from '../SplitClient';
jest.mock('../SplitClient');

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import { withSplitFactory } from '../withSplitFactory';

describe('withSplitFactory', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes no-ready props to the child if initialized with a no ready factory (e.g., using config object).', () => {
    const Component = withSplitFactory(sdkBrowser)(
      ({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
        expect(factory).toBeInstanceOf(Object);
        expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
        return null;
      }
    );
    render(<Component />);
  });

  test('passes ready props to the child if initialized with a ready factory.', (done) => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      const Component = withSplitFactory(undefined, outerFactory)(
        ({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBe(outerFactory);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([true, true, false, false, false, 0]);
          return null;
        }
      );
      render(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      ({ outerProp1, outerProp2, factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
        expect(outerProp1).toBe('outerProp1');
        expect(outerProp2).toBe(2);
        expect(factory).toBeInstanceOf(Object);
        expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
        return null;
      }
    );
    render(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitFactory.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const updateOnSdkReadyFromCache = false;
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache
    );

    render(<Component outerProp1='outerProp1' outerProp2={2} />);

    expect(SplitClient).toHaveBeenCalledTimes(1);
    expect((SplitClient as jest.Mock).mock.calls[0][0]).toMatchObject({
      updateOnSdkUpdate,
      updateOnSdkTimedout,
      updateOnSdkReady,
      updateOnSdkReadyFromCache
    });
  });

});
