import React from 'react';
import { render, act } from '@testing-library/react';

/** Mocks and test utils */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { ISplitClientChildProps } from '../types';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';
import { IClientWithContext } from '../utils';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    render(
      <SplitFactoryProvider config={sdkBrowser} >
        <SplitClient splitKey='user1' >
          {({ isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitClientChildProps) => {
            expect(isReady).toBe(false);
            expect(isReadyFromCache).toBe(false);
            expect(hasTimedout).toBe(false);
            expect(isTimedout).toBe(false);
            expect(isDestroyed).toBe(false);
            expect(lastUpdate).toBe(0);

            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );
  });

  test('passes ready props to the child if client is ready.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    await outerFactory.client().ready();

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {/* Equivalent to <SplitClient splitKey={undefined} > */}
        <SplitClient splitKey={sdkBrowser.core.key} >
          {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitClientChildProps) => {
            expect(client).toBe(outerFactory.client());
            expect(isReady).toBe(true);
            expect(isReadyFromCache).toBe(true);
            expect(hasTimedout).toBe(false);
            expect(isTimedout).toBe(false);
            expect(isDestroyed).toBe(false);
            expect(lastUpdate).toBe((outerFactory.client() as IClientWithContext).__getStatus().lastUpdate);

            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );
  });

  test('rerender child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    await outerFactory.client().ready();

    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
          {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitClientChildProps) => {
            const statusProps = [isReady, isReadyFromCache, hasTimedout, isTimedout];
            switch (renderTimes) {
              case 0: // No ready
                expect(statusProps).toStrictEqual([false, false, false, false]);
                break;
              case 1: // Timedout
                expect(statusProps).toStrictEqual([false, false, true, true]);
                break;
              case 2: // Ready from cache
                expect(statusProps).toStrictEqual([false, true, true, true]);
                break;
              case 3: // Ready
                expect(statusProps).toStrictEqual([true, true, true, false]);
                break;
              case 4: // Updated
                expect(statusProps).toStrictEqual([true, true, true, false]);
                break;
              default:
                fail('Child must not be rerendered');
            }
            expect(client).toBe(outerFactory.client('user2'));
            expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
            renderTimes++;
            previousLastUpdate = lastUpdate;
            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(5);
  });

  test('rerender child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    await outerFactory.client().ready();

    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
          {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitClientChildProps) => {
            const statusProps = [isReady, isReadyFromCache, hasTimedout, isTimedout];
            switch (renderTimes) {
              case 0: // No ready
                expect(statusProps).toStrictEqual([false, false, false, false]);
                break;
              case 1: // Timedout
                expect(statusProps).toStrictEqual([false, false, true, true]);
                break;
              case 2: // Updated. Although `updateOnSdkReady` is false, status props must reflect the current status of the client.
                expect(statusProps).toStrictEqual([true, false, true, false]);
                break;
              default:
                fail('Child must not be rerendered');
            }
            expect(client).toBe(outerFactory.client('user2'));
            expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
            renderTimes++;
            previousLastUpdate = lastUpdate;
            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(3);
  });

  test('rerender child only on SDK_READY event, as default behaviour.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    await outerFactory.client().ready();

    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' >
          {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitClientChildProps) => {
            const statusProps = [isReady, isReadyFromCache, hasTimedout, isTimedout];
            switch (renderTimes) {
              case 0: // No ready
                expect(statusProps).toStrictEqual([false, false, false, false]);
                break;
              case 1: // Ready
                expect(statusProps).toStrictEqual([true, false, true, false]); // not rerendering on SDK_TIMEOUT, but hasTimedout reflects the current state
                break;
              default:
                fail('Child must not be rerendered');
            }
            expect(client).toBe(outerFactory.client('user2'));
            expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
            renderTimes++;
            previousLastUpdate = lastUpdate;
            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(2);
  });

  test('must update on SDK events between the render and commit phases', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let count = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='some_user' >
          {({ client }) => {
            count++;

            // side effect in the render phase
            if (!(client as IClientWithContext).__getStatus().isReady) {
              console.log('emit');
              (client as any).__emitter__.emit(Event.SDK_READY);
            }

            return null;
          }}
        </SplitClient>
      </SplitFactoryProvider>
    );

    expect(count).toEqual(2);
  });

  test('renders a passed JSX.Element with a new SplitContext value.', (done) => {
    const outerFactory = SplitFactory(sdkBrowser);

    const Component = () => {
      return (
        <SplitContext.Consumer>
          {(value) => {
            expect(value.client).toBe(outerFactory.client('user2'));
            expect(value.isReady).toBe(false);
            expect(value.isTimedout).toBe(false);
            expect(value.lastUpdate).toBe(0);
            done();
            return null;
          }}
        </SplitContext.Consumer>
      );
    };

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <SplitClient splitKey='user2' >
          <Component />
        </SplitClient>
      </SplitFactoryProvider>
    );
  });

  // @TODO Update test in breaking change, following common practice in React libraries, like React-redux and React-query: use a falsy value as default context value, and throw an error – instead of logging it – if components are not wrapped in a SplitContext.Provider, i.e., if the context is falsy.
  // test('logs error and passes null client if rendered outside an SplitProvider component.', () => {
  //   const errorSpy = jest.spyOn(console, 'error');
  //   render(
  //     <SplitClient splitKey='user2' >
  //       {({ client }) => {
  //         expect(client).toBe(null);
  //         return null;
  //       }}
  //     </SplitClient>
  //   );
  //   expect(errorSpy).toBeCalledWith(ERROR_SC_NO_FACTORY);
  // });

  test(`passes a new client if re-rendered with a different splitKey.
        Only updates the state if the new client triggers an event, but not the previous one.`, (done) => {
    const outerFactory = SplitFactory(sdkBrowser);
    let renderTimes = 0;

    class InnerComponent extends React.Component<any, { splitKey: string }> {

      constructor(props: any) {
        super(props);
        this.state = { splitKey: 'user1' };
      }

      async componentDidMount() {
        await act(() => this.setState({ splitKey: 'user2' }));
        await act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT));
        await act(() => (outerFactory as any).client('user1').__emitter__.emit(Event.SDK_READY_TIMED_OUT));
        await act(() => this.setState({ splitKey: 'user3' }));
        await act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY));
        await act(() => (outerFactory as any).client('user3').__emitter__.emit(Event.SDK_READY));
        await act(() => (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE));
        await act(() => (outerFactory as any).client('user3').__emitter__.emit(Event.SDK_UPDATE));
        expect(renderTimes).toBe(6);

        done();
      }

      render() {
        return (
          <SplitClient
            splitKey={this.state.splitKey}
            updateOnSdkTimedout={true}
            updateOnSdkUpdate={true} >
            {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout }: ISplitClientChildProps) => {
              const statusProps = [isReady, isReadyFromCache, hasTimedout, isTimedout];
              switch (renderTimes) {
                case 0:
                  expect(client).toBe(outerFactory.client('user1'));
                  expect(statusProps).toStrictEqual([false, false, false, false]);
                  break;
                case 1:
                  expect(client).toBe(outerFactory.client('user2'));
                  expect(statusProps).toStrictEqual([false, false, false, false]);
                  break;
                case 2:
                  expect(client).toBe(outerFactory.client('user2'));
                  expect(statusProps).toStrictEqual([false, false, true, true]);
                  break;
                case 3:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(statusProps).toStrictEqual([false, false, false, false]);
                  break;
                case 4:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(statusProps).toStrictEqual([true, false, false, false]);
                  break;
                case 5:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(statusProps).toStrictEqual([true, false, false, false]);
                  break;
                default:
                  fail('Child must not be rerendered');
              }
              renderTimes++;
              return null;
            }}
          </SplitClient >
        );
      }
    }

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <InnerComponent />
      </SplitFactoryProvider>
    );
  });

  test('attributes binding test with utility', (done) => {

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      return (
        <SplitFactoryProvider factory={factory} attributes={attributesFactory} >
          <SplitClient splitKey={splitKey} attributes={attributesClient} trafficType='user' >
            {() => {
              testSwitch(done, splitKey);
              return null;
            }}
          </SplitClient>
        </SplitFactoryProvider>
      );
    }

    testAttributesBinding(Component);
  });

});
