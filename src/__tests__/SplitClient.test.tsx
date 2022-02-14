import React from 'react';
import { mount, ReactWrapper } from 'enzyme'; // @ts-ignore. No declaration file
import { SplitFactory as originalSplitFactory } from '../../lib/splitio/index';

/** Mocks and test utils */
import { mockSdk, Event, assertNoListeners, clientListenerCount } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { ISplitClientChildProps } from '../types';
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import SplitContext, { ISplitContextValues } from '../SplitContext';
import { ERROR_SC_NO_FACTORY } from '../constants';
import SplitIO from '@splitsoftware/splitio/types/splitio';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    let clientToCheck;

    mount(
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
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      let clientToCheck;

      mount(
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
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      const wrapper = mount(
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
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      const wrapper = mount(
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
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      mount(
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

    mount(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >
          <Component />
        </SplitClient>
      </SplitFactory>);
  });

  test('logs error and passes null client if rendered outside an SplitProvider component.', () => {
    const errorSpy = jest.spyOn(console, 'error');
    mount(
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
    let renderTimes = 0;
    let wrapper: ReactWrapper;

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
                          (wrapper as ReactWrapper).unmount();
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
            {({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitClientChildProps) => {
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

    wrapper = mount(
      <SplitFactory factory={outerFactory} >
        <InnerComponent />
      </SplitFactory>);
  });

  test('calls client setAttributes and clearAttributes.', (done) => {
    let renderTimes = 0;
    const attributesFactory = { at1: 'at1' };
    const attributesClient = { at2: 'at2' };
    const factory = originalSplitFactory({
      core: {
        authorizationKey: 'localhost',
        key: 'emma'
      },
      features: {
        test_split: 'on'
      }
    })

    const mainClient = factory?.client();
    const mainClientSpy = {
      setAttributes: jest.spyOn(mainClient, 'setAttributes'),
      clearAttributes: jest.spyOn(mainClient, 'clearAttributes')
    }

    const client = factory?.client('user1');
    const clientSpy = {
      setAttributes: jest.spyOn(client, 'setAttributes'),
      clearAttributes: jest.spyOn(client, 'clearAttributes'),
    }

    function Component({ attributesFactory, attributesClient }: { attributesFactory: SplitIO.Attributes, attributesClient: SplitIO.Attributes }) {
      return (
        <SplitFactory factory={factory} attributes={attributesFactory} >
          <SplitClient splitKey='user1' attributes={attributesClient} >
            {({ client }: ISplitClientChildProps) => {
              renderTimes++;
              switch (renderTimes) {
                case 1:
                  expect(mainClientSpy.setAttributes).lastCalledWith(attributesFactory);
                  expect(clientSpy.setAttributes).lastCalledWith(attributesClient);
                  expect(mainClient?.getAttributes()).toStrictEqual(attributesFactory);
                  expect(client?.getAttributes()).toStrictEqual(attributesClient);
                  break;
                case 2:
                  expect(mainClientSpy.clearAttributes).toBeCalledTimes(1);
                  expect(clientSpy.setAttributes).lastCalledWith(attributesClient);
                  expect(mainClient?.getAttributes()).toStrictEqual({});
                  expect(client?.getAttributes()).toStrictEqual({at2: 'at2', at3:'at3'});
                  break;
                case 3:
                  expect(mainClientSpy.setAttributes).lastCalledWith({at4: 'at4'});
                  expect(clientSpy.clearAttributes).toBeCalledTimes(2);
                  expect(mainClient?.getAttributes()).toStrictEqual({at4: 'at4'});
                  expect(client?.getAttributes()).toStrictEqual({});
                  break;
                case 4:
                  expect(mainClientSpy.clearAttributes).toBeCalledTimes(2);
                  expect(clientSpy.clearAttributes).toBeCalledTimes(4);
                  expect(mainClient?.getAttributes()).toStrictEqual({});
                  expect(client?.getAttributes()).toStrictEqual({});
                  done();
                }
              return null;
            }}
          </SplitClient>
        </SplitFactory>
      );
    }

    const wrapper = mount(<Component attributesFactory={attributesFactory} attributesClient={attributesClient} />);

    wrapper.setProps({ attributesFactory: undefined, attributesClient: {at3: 'at3'} });
    wrapper.setProps({ attributesFactory: {at4: 'at4'}, attributesClient: undefined });
    wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });

  });

});
