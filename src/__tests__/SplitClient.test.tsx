import React from 'react';
import { render, RenderResult } from '@testing-library/react';

/** Mocks and test utils */
import { mockSdk, Event, assertNoListeners, clientListenerCount } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { ISplitClientChildProps } from '../types';
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import SplitContext, { ISplitContextValues } from '../SplitContext';
import { ERROR_SC_NO_FACTORY } from '../constants';
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    let clientToCheck;

    render(
      <SplitFactory config={sdkBrowser} >
        <SplitClient splitKey='user1' >
          {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitClientChildProps) => {
            expect(isReady).toBe(false);
            expect(isReadyFromCache).toBe(false);
            expect(hasTimedout).toBe(false);
            expect(isTimedout).toBe(false);
            expect(isDestroyed).toBe(false);
            expect(lastUpdate).toBe(0);

            clientToCheck = client;
            return null;
          }}
        </SplitClient>
      </SplitFactory>
    );

    // After component mount, listeners should be attached for all ONCE events when none of them has been emitted yet
    expect(clientListenerCount(clientToCheck, Event.SDK_READY)).toBe(1);
    expect(clientListenerCount(clientToCheck, Event.SDK_READY_FROM_CACHE)).toBe(1);
    expect(clientListenerCount(clientToCheck, Event.SDK_READY_TIMED_OUT)).toBe(1);
  });

  test('passes ready props to the child if client is ready.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      let clientToCheck;

      render(
        <SplitFactory factory={outerFactory} >
          <SplitClient splitKey={sdkBrowser.core.key} >
            {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitClientChildProps) => {
              expect(client).toBe(outerFactory.client());
              expect(isReady).toBe(true);
              expect(isReadyFromCache).toBe(true);
              expect(hasTimedout).toBe(false);
              expect(isTimedout).toBe(false);
              expect(isDestroyed).toBe(false);
              expect(lastUpdate).toBe(0);

              clientToCheck = client;
              return null;
            }}
          </SplitClient>
        </SplitFactory>
      );

      // After component mount, listeners should not be attached for those ONCE events that has been already emitted
      expect(clientListenerCount(clientToCheck, Event.SDK_READY)).toBe(0);
      expect(clientListenerCount(clientToCheck, Event.SDK_READY_FROM_CACHE)).toBe(0);
      expect(clientListenerCount(clientToCheck, Event.SDK_READY_TIMED_OUT)).toBe(0); // this event was not emitted, but will not anyway, since SDK_READY has.

      done();
    });
  });

  test('rerender child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      const wrapper = render(
        <SplitFactory factory={outerFactory} >
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
              expect(lastUpdate).toBeLessThanOrEqual(Date.now());
              renderTimes++;
              previousLastUpdate = lastUpdate;
              return null;
            }}
          </SplitClient>
        </SplitFactory>);

      setTimeout(() => {
        (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        setTimeout(() => {
          (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_FROM_CACHE);
          setTimeout(() => {
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
            setTimeout(() => {
              (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
              setTimeout(() => {
                expect(renderTimes).toBe(5);

                // check that outerFactory's clients have no event listeners
                wrapper.unmount();
                assertNoListeners(outerFactory);
                done();
              });
            });
          });
        });
      });
    });
  });

  test('rerender child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      const wrapper = render(
        <SplitFactory factory={outerFactory} >
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
              expect(lastUpdate).toBeLessThanOrEqual(Date.now());
              renderTimes++;
              previousLastUpdate = lastUpdate;
              return null;
            }}
          </SplitClient>
        </SplitFactory>);

      setTimeout(() => {
        (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        setTimeout(() => {
          (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
          setTimeout(() => {
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
            setTimeout(() => {
              expect(renderTimes).toBe(3);

              // check that outerFactory's clients have no event listeners
              wrapper.unmount();
              assertNoListeners(outerFactory);
              done();
            });
          });
        });
      });
    });
  });

  test('rerender child only on SDK_READY event, as default behaviour.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      render(
        <SplitFactory factory={outerFactory} >
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
              expect(lastUpdate).toBeLessThanOrEqual(Date.now());
              renderTimes++;
              previousLastUpdate = lastUpdate;
              return null;
            }}
          </SplitClient>
        </SplitFactory>);

      setTimeout(() => {
        (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        setTimeout(() => {
          (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
          setTimeout(() => {
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
            setTimeout(() => {
              expect(renderTimes).toBe(2);
              done();
            });
          });
        });
      });
    });

  });

  test('renders a passed JSX.Element with a new SplitContext value.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);

    const Component = () => {
      return (
        <SplitContext.Consumer>{(value: ISplitContextValues) => {
          expect(value.client).toBe(outerFactory.client('user2'));
          expect(value.isReady).toBe(false);
          expect(value.isTimedout).toBe(false);
          expect(value.lastUpdate).toBe(0);
          done();
          return null;
        }}</SplitContext.Consumer>
      );
    };

    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >
          <Component />
        </SplitClient>
      </SplitFactory>);
  });

  test('logs error and passes null client if rendered outside an SplitProvider component.', () => {
    const errorSpy = jest.spyOn(console, 'error');
    render(
      <SplitClient splitKey='user2' >
        {({ client }) => {
          expect(client).toBe(null);
          return null;
        }}
      </SplitClient>);
    expect(errorSpy).toBeCalledWith(ERROR_SC_NO_FACTORY);
  });

  test(`passes a new client if re-rendered with a different splitKey.
        Only updates the state if the new client triggers an event, but not the previous one.`, (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0; // eslint-disable-next-line prefer-const
    let wrapper: RenderResult;

    class InnerComponent extends React.Component<any, { splitKey: string }> {

      constructor(props: any) {
        super(props);
        this.state = { splitKey: 'user1' };
      }

      componentDidMount() {
        setTimeout(() => {
          this.setState({ splitKey: 'user2' });
          setTimeout(() => {
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
            setTimeout(() => {
              (outerFactory as any).client('user1').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
              setTimeout(() => {
                this.setState({ splitKey: 'user3' });
                setTimeout(() => {
                  (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
                  setTimeout(() => {
                    (outerFactory as any).client('user3').__emitter__.emit(Event.SDK_READY);
                    setTimeout(() => {
                      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
                      setTimeout(() => {
                        (outerFactory as any).client('user3').__emitter__.emit(Event.SDK_UPDATE);
                        setTimeout(() => {
                          expect(renderTimes).toBe(6);

                          // check that outerFactory's clients have no event listeners
                          wrapper.unmount();
                          assertNoListeners(outerFactory);
                          done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
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

    wrapper = render(
      <SplitFactory factory={outerFactory} >
        <InnerComponent />
      </SplitFactory>);
  });

  test('attributes binding test with utility', (done) => {

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      return (
        <SplitFactory factory={factory} attributes={attributesFactory} >
          <SplitClient splitKey={splitKey} attributes={attributesClient} trafficType='user' >
            {() => {
              testSwitch(done, splitKey);
              return null;
            }}
          </SplitClient>
        </SplitFactory>
      );
    }

    testAttributesBinding(Component);

  });

});
