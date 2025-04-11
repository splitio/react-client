import * as React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import * as SplitClient from '../SplitClient';
const SplitClientSpy = jest.spyOn(SplitClient, 'SplitClient');
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';

/** Test target */
import { withSplitFactory } from '../withSplitFactory';
import { withSplitClient } from '../withSplitClient';

describe('withSplitClient', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes no-ready props to the child if client is not ready.', () => {
    const Component = withSplitFactory(sdkBrowser)(
      withSplitClient('user1')(
        ({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
          expect(client).not.toBe(null);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
          return null;
        }
      )
    );
    render(<Component />);
  });

  test('passes ready props to the child if client is ready.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      const Component = withSplitFactory(undefined, outerFactory)(
        withSplitClient('user1')(
          ({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
            expect(client).toBe(outerFactory.client('user1'));
            expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
            return null;
          }
        )
      );
      render(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
        ({ outerProp1, outerProp2, client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
          expect(outerProp1).toBe('outerProp1');
          expect(outerProp2).toBe(2);
          expect(client).not.toBe(null);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
          return null;
        }
      )
    );
    render(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitClient.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const updateOnSdkReadyFromCache = false;
    const Component = withSplitFactory(sdkBrowser)(
      withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
        () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache
      )
    );
    render(<Component outerProp1='outerProp1' outerProp2={2} />);

    expect(SplitClientSpy).toHaveBeenCalledTimes(2);
    expect(SplitClientSpy.mock.calls[1][0]).toMatchObject({
      updateOnSdkUpdate,
      updateOnSdkTimedout,
      updateOnSdkReady,
      updateOnSdkReadyFromCache,
    });
  });

  test('attributes binding test with utility', (done) => {

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      const FactoryComponent = withSplitFactory(undefined, factory, attributesFactory)<{ attributesClient: SplitIO.Attributes, splitKey: any }>(
        ({ attributesClient, splitKey }) => {
          const ClientComponent = withSplitClient(splitKey, attributesClient)(
            () => {
              testSwitch(done, splitKey);
              return null;
            })
          return <ClientComponent />;
        }
      )
      return <FactoryComponent attributesClient={attributesClient} splitKey={splitKey} />
    }

    testAttributesBinding(Component);
  });

});
