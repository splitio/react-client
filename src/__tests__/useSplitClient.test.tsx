import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { useSplitClient } from '../useSplitClient';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitContext } from '../SplitContext';
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';
import { EXCEPTION_NO_SFP } from '../constants';

describe('useSplitClient', () => {

  test('returns the main client from the context updated by SplitFactoryProvider.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let client;
    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          client = useSplitClient().client;
          return null;
        })}
      </SplitFactoryProvider>
    );
    expect(client).toBe(outerFactory.client());
  });

  test('returns a new client from the factory at Split context given a splitKey.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let client;
    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          (outerFactory.client as jest.Mock).mockClear();
          client = useSplitClient({ splitKey: 'user2' }).client;
          return null;
        })}
      </SplitFactoryProvider>
    );
    expect(outerFactory.client as jest.Mock).toBeCalledWith('user2');
    expect(outerFactory.client as jest.Mock).toHaveReturnedWith(client);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useSplitClient();
          useSplitClient({ splitKey: 'user2' });
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

  test('attributes binding test with utility', (done) => {

    // eslint-disable-next-line react/prop-types
    const InnerComponent = ({ splitKey, attributesClient, testSwitch }) => {
      useSplitClient({ splitKey, attributes: attributesClient });
      testSwitch(done, splitKey);
      return null;
    };

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      return (
        <SplitFactoryProvider factory={factory} attributes={attributesFactory} >
          <InnerComponent splitKey={splitKey} attributesClient={attributesClient} testSwitch={testSwitch} />
        </SplitFactoryProvider>
      );
    }

    testAttributesBinding(Component);
  });

  test('must update on SDK events', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countUseSplitClient = 0, countUseSplitClientUser2 = 0;
    let countUseSplitClientWithoutUpdate = 0, countUseSplitClientUser2WithoutTimeout = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          {React.createElement(() => {
            // Equivalent to using config key: `const { client } = useSplitClient({ splitKey: sdkBrowser.core.key, attributes: { att1: 'att1' } });`
            const { client } = useSplitClient({ attributes: { att1: 'att1' } });
            expect(client).toBe(mainClient); // Assert that the main client was retrieved.
            expect(client!.getAttributes()).toEqual({ att1: 'att1' }); // Assert that the client was retrieved with the provided attributes.
            countUseSplitClient++;
            return null;
          })}
          {React.createElement(() => {
            const { client, isReady, isReadyFromCache, hasTimedout } = useSplitClient({ splitKey: 'user_2', updateOnSdkUpdate: true });
            expect(client).toBe(user2Client);

            countUseSplitClientUser2++;
            switch (countUseSplitClientUser2) {
              case 1: // initial render
                expect([isReady, isReadyFromCache, hasTimedout]).toEqual([false, false, false]);
                break;
              case 2: // SDK_READY_FROM_CACHE
                expect([isReady, isReadyFromCache, hasTimedout]).toEqual([false, true, false]);
                break;
              case 3: // SDK_READY_TIMED_OUT
                expect([isReady, isReadyFromCache, hasTimedout]).toEqual([false, true, true]);
                break;
              case 4: // SDK_READY
                expect([isReady, isReadyFromCache, hasTimedout]).toEqual([true, true, true]);
                break;
              case 5: // SDK_UPDATE
                expect([isReady, isReadyFromCache, hasTimedout]).toEqual([true, true, true]);
                break;
              default:
                throw new Error('Unexpected render');
            }
            return null;
          })}
          {React.createElement(() => {
            useSplitClient({ splitKey: sdkBrowser.core.key, updateOnSdkUpdate: false }).client;
            countUseSplitClientWithoutUpdate++;
            return null;
          })}
          {React.createElement(() => {
            useSplitClient({ splitKey: 'user_2', updateOnSdkTimedout: false });
            countUseSplitClientUser2WithoutTimeout++;
            return null;
          })}
        </>
      </SplitFactoryProvider>
    );

    act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => mainClient.__emitter__.emit(Event.SDK_READY));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY));
    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
    act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

    // SplitFactoryProvider renders once
    expect(countSplitContext).toEqual(1);

    // If useSplitClient retrieves the main client and have default update options, it re-renders for each main client event.
    expect(countUseSplitClient).toEqual(4);

    // If useSplitClient retrieves a different client and have default update options, it re-renders for each event of the new client.
    expect(countUseSplitClientUser2).toEqual(5);

    // If useSplitClient retrieves the main client and have updateOnSdkUpdate = false, it doesn't render when the main client updates.
    expect(countUseSplitClientWithoutUpdate).toEqual(3);

    // If useSplitClient retrieves a different client and have updateOnSdkTimedout = false, it doesn't render when the the new client times out.
    expect(countUseSplitClientUser2WithoutTimeout).toEqual(4);
  });

  // Remove this test once side effects are moved to the useSplitClient effect.
  test('must update on SDK events between the render phase (hook call) and commit phase (effect call)', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let count = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          useSplitClient({ splitKey: 'some_user' });
          count++;

          // side effect in the render phase
          const client = outerFactory.client('some_user') as any;
          if (!client.__getStatus().isReady) client.__emitter__.emit(Event.SDK_READY);

          return null;
        })}
      </SplitFactoryProvider>
    )

    expect(count).toEqual(2);
  });

  test('must support changes in update props', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;

    let rendersCount = 0;

    function InnerComponent(updateOptions) {
      useSplitClient(updateOptions);
      rendersCount++;
      return null;
    }

    function Component(updateOptions) {
      return (
        <SplitFactoryProvider factory={outerFactory} >
          <InnerComponent {...updateOptions} />
        </SplitFactoryProvider>
      )
    }

    const wrapper = render(<Component updateOnSdkUpdate={false} />);
    expect(rendersCount).toBe(1);

    act(() => mainClient.__emitter__.emit(Event.SDK_READY)); // trigger re-render
    expect(rendersCount).toBe(2);

    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE)); // do not trigger re-render because updateOnSdkUpdate is false
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
