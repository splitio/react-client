import React from 'react';
import { mount } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './utils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './utils/sdkConfigs';

/** Test target */
import { ISplitClientChildProps } from '../types';
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import SplitContext, { ISplitContextValues } from '../SplitContext';
import { ERROR_SC_NO_FACTORY } from '../constants';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    mount(
      <SplitFactory config={sdkBrowser} >
        <SplitClient splitKey='user1' >
          {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
            expect(isReady).toBe(false);
            expect(isTimedout).toBe(false);
            expect(lastUpdate).toBe(0);
            return null;
          }}
        </SplitClient>
      </SplitFactory>);
  });

  test('passes ready props to the child if client is ready.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      mount(
        <SplitFactory factory={outerFactory} >
          <SplitClient splitKey={sdkBrowser.core.key} >
            {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
              expect(client).toBe(outerFactory.client());
              expect(isReady).toBe(true);
              expect(isTimedout).toBe(false);
              expect(lastUpdate).toBe(0);
              return null;
            }}
          </SplitClient>
        </SplitFactory>);
      done();
    });
  });

  test('rerender child on SDK_READY_TIMEDOUT, SDK_READY and SDK_UPDATE events.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);

    outerFactory.client().ready().then(() => {

      let renderTimes = 0;
      let previousLastUpdate = -1;

      mount(
        <SplitFactory factory={outerFactory} >
          <SplitClient splitKey='user2' updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
            {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
              switch (renderTimes) {
                case 0: // No ready
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 1: // Timedout
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(true);
                  break;
                case 2: // Ready
                  expect(isReady).toBe(true);
                  expect(isTimedout).toBe(false);
                  break;
                case 3: // Updated
                  expect(isReady).toBe(true);
                  expect(isTimedout).toBe(false);
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
              expect(renderTimes).toBe(4);
              done();
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

      mount(
        <SplitFactory factory={outerFactory} >
          <SplitClient splitKey='user2' updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
            {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
              switch (renderTimes) {
                case 0: // No ready
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 1: // Timedout
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(true);
                  break;
                case 2: // Updated. Although the SDK client is ready, props are like timedout.
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(true);
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
            {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
              switch (renderTimes) {
                case 0: // No ready
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 1: // Ready
                  expect(isReady).toBe(true);
                  expect(isTimedout).toBe(false);
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

    class InnerComponent extends React.Component<any, { splitKey: string }> {

      constructor(props: any) {
        super(props);
        this.state = { splitKey: 'user1' };
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
            {({ client, isReady, isTimedout, lastUpdate }: ISplitClientChildProps) => {
              switch (renderTimes) {
                case 0:
                  expect(client).toBe(outerFactory.client('user1'));
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 1:
                  expect(client).toBe(outerFactory.client('user2'));
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 2:
                  expect(client).toBe(outerFactory.client('user2'));
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(true);
                  break;
                case 3:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(isReady).toBe(false);
                  expect(isTimedout).toBe(false);
                  break;
                case 4:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(isReady).toBe(true);
                  expect(isTimedout).toBe(false);
                  break;
                case 5:
                  expect(client).toBe(outerFactory.client('user3'));
                  expect(isReady).toBe(true);
                  expect(isTimedout).toBe(false);
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

    mount(
      <SplitFactory factory={outerFactory} >
        <InnerComponent />
      </SplitFactory>);
  });

});
