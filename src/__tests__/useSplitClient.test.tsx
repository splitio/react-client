import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { useSplitClient } from '../useSplitClient';
import { SplitFactory } from '../SplitFactory';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';

describe('useSplitClient', () => {

  test('returns the main client from the context updated by SplitFactory.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    render(
      <SplitFactory factory={outerFactory} >
        {React.createElement(() => {
          client = useSplitClient().client;
          return null;
        })}
      </SplitFactory>
    );
    expect(client).toBe(outerFactory.client());
  });

  test('returns the client from the context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >
          {React.createElement(() => {
            client = useSplitClient().client;
            return null;
          })}
        </SplitClient>
      </SplitFactory>
    );
    expect(client).toBe(outerFactory.client('user2'));
  });

  test('returns a new client from the factory at Split context given a splitKey.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    render(
      <SplitFactory factory={outerFactory} >
        {React.createElement(() => {
          (outerFactory.client as jest.Mock).mockClear();
          client = useSplitClient({ splitKey: 'user2', trafficType: 'user' }).client;
          return null;
        })}
      </SplitFactory>
    );
    expect(outerFactory.client as jest.Mock).toBeCalledWith('user2', 'user');
    expect(outerFactory.client as jest.Mock).toHaveReturnedWith(client);
  });

  test('returns null if invoked outside Split context.', () => {
    let client;
    let sharedClient;
    render(
      React.createElement(() => {
        client = useSplitClient().client;
        sharedClient = useSplitClient({ splitKey: 'user2', trafficType: 'user' }).client;
        return null;
      })
    );
    expect(client).toBe(null);
    expect(sharedClient).toBe(null);
  });

  test('attributes binding test with utility', (done) => {

    // eslint-disable-next-line react/prop-types
    const InnerComponent = ({ splitKey, attributesClient, testSwitch }) => {
      useSplitClient({ splitKey, trafficType: 'user', attributes: attributesClient});
      testSwitch(done, splitKey);
      return null;
    };

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      return (
        <SplitFactory factory={factory} attributes={attributesFactory} >
          <InnerComponent splitKey={splitKey} attributesClient={attributesClient} testSwitch={testSwitch} />
        </SplitFactory>
      );
    }

    testAttributesBinding(Component);
  });

  test('useSplitClient must update on SDK events', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countSplitClient = 0, countSplitClientUser2 = 0, countUseSplitClient = 0, countUseSplitClientUser2 = 0;
    let countSplitClientWithUpdate = 0, countUseSplitClientWithUpdate = 0, countSplitClientUser2WithUpdate = 0, countUseSplitClientUser2WithUpdate = 0;
    let countNestedComponent = 0;

    render(
      <SplitFactory factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          <SplitClient splitKey={sdkBrowser.core.key} trafficType={sdkBrowser.core.trafficType}
            /* Disabling update props is ineffective because the wrapping SplitFactory has them enabled: */
            updateOnSdkReady={false} updateOnSdkReadyFromCache={false}
          >
            {() => { countSplitClient++; return null }}
          </SplitClient>
          {React.createElement(() => {
            // Equivalent to
            // - Using config key and traffic type: `const { client } = useSplitClient(sdkBrowser.core.key, sdkBrowser.core.trafficType, { att1: 'att1' });`
            // - Disabling update props, since the wrapping SplitFactory has them enabled: `const { client } = useSplitClient(undefined, undefined, { att1: 'att1' }, { updateOnSdkReady: false, updateOnSdkReadyFromCache: false });`
            const { client } = useSplitClient({ attributes: { att1: 'att1' } });
            expect(client).toBe(mainClient); // Assert that the main client was retrieved.
            expect(client!.getAttributes()).toEqual({ att1: 'att1' }); // Assert that the client was retrieved with the provided attributes.
            countUseSplitClient++;
            return null;
          })}
          <SplitClient splitKey={'user_2'}>
            {() => { countSplitClientUser2++; return null }}
          </SplitClient>
          {React.createElement(() => {
            const { client } = useSplitClient({ splitKey: 'user_2' });
            expect(client).toBe(user2Client);
            countUseSplitClientUser2++;
            return null;
          })}
          <SplitClient splitKey={sdkBrowser.core.key} updateOnSdkUpdate={true} >
            {() => { countSplitClientWithUpdate++; return null }}
          </SplitClient>
          {React.createElement(() => {
            useSplitClient({ splitKey: sdkBrowser.core.key, trafficType: sdkBrowser.core.trafficType, updateOnSdkUpdate: true }).client;
            countUseSplitClientWithUpdate++;
            return null;
          })}
          <SplitClient splitKey={'user_2'} updateOnSdkUpdate={true}>
            {() => { countSplitClientUser2WithUpdate++; return null }}
          </SplitClient>
          {React.createElement(() => {
            useSplitClient({ splitKey: 'user_2', updateOnSdkUpdate: true });
            countUseSplitClientUser2WithUpdate++;
            return null;
          })}
          <SplitClient splitKey={'user_2'} updateOnSdkUpdate={true}>
            {React.createElement(() => {
              const status = useSplitClient({ splitKey: 'user_2', updateOnSdkUpdate: true });
              expect(status.client).toBe(user2Client);

              // useSplitClient doesn't re-render twice if it is in the context of a SplitClient with same user key and there is a SDK event
              countNestedComponent++;
              switch (countNestedComponent) {
                case 1:
                  expect(status.isReady).toBe(false);
                  expect(status.isReadyFromCache).toBe(false);
                  break;
                case 2:
                  expect(status.isReady).toBe(false);
                  expect(status.isReadyFromCache).toBe(true);
                  break;
                case 3:
                  expect(status.isReady).toBe(true);
                  expect(status.isReadyFromCache).toBe(true);
                  break;
                case 4:
                  break;
                default:
                  throw new Error('Unexpected render');
              }
              return null;
            })}
          </SplitClient>
        </>
      </SplitFactory>
    );

    act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => mainClient.__emitter__.emit(Event.SDK_READY));
    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY));
    act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

    // SplitContext renders 3 times: initially, when ready from cache, and when ready.
    expect(countSplitContext).toEqual(3);

    // If SplitClient and useSplitClient retrieve the same client than the context and have default update options,
    // they render when the context renders.
    expect(countSplitClient).toEqual(countSplitContext);
    expect(countUseSplitClient).toEqual(countSplitContext);

    // If SplitClient and useSplitClient retrieve a different client than the context and have default update options,
    // they render when the context renders and when the new client is ready and ready from cache.
    expect(countSplitClientUser2).toEqual(countSplitContext + 2);
    expect(countUseSplitClientUser2).toEqual(countSplitContext + 2);

    // If SplitClient and useSplitClient retrieve the same client than the context and have updateOnSdkUpdate = true,
    // they render when the context renders and when the client updates.
    expect(countSplitClientWithUpdate).toEqual(countSplitContext + 1);
    expect(countUseSplitClientWithUpdate).toEqual(countSplitContext + 1);

    // If SplitClient and useSplitClient retrieve a different client than the context and have updateOnSdkUpdate = true,
    // they render when the context renders and when the new client is ready, ready from cache and updates.
    expect(countSplitClientUser2WithUpdate).toEqual(countSplitContext + 3);
    expect(countUseSplitClientUser2WithUpdate).toEqual(countSplitContext + 3);

    expect(countNestedComponent).toEqual(4);
  });

  test('useSplitClient must support changes in update props', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const mainClient = outerFactory.client() as any;

    let rendersCount = 0;

    function InnerComponent(updateOptions) {
      useSplitClient(updateOptions);
      rendersCount++;
      return null;
    }

    function Component(updateOptions) {
      return (
        <SplitFactory factory={outerFactory} >
          <InnerComponent {...updateOptions} />
        </SplitFactory>
      )
    }

    const wrapper = render(<Component />);
    expect(rendersCount).toBe(1);

    act(() => mainClient.__emitter__.emit(Event.SDK_READY)); // trigger re-render
    expect(rendersCount).toBe(2);

    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE)); // do not trigger re-render because updateOnSdkUpdate is false by default
    expect(rendersCount).toBe(2);

    wrapper.rerender(<Component updateOnSdkUpdate={true} />); // trigger re-render
    expect(rendersCount).toBe(3);

    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE)); // trigger re-render because updateOnSdkUpdate is true now
    expect(rendersCount).toBe(4);

    wrapper.rerender(<Component updateOnSdkUpdate={false} />); // trigger re-render
    expect(rendersCount).toBe(5);

    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE)); // do not trigger re-render because updateOnSdkUpdate is false now
    expect(rendersCount).toBe(5);
  });

});
