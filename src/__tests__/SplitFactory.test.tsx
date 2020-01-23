import React from 'react';
import { shallow, mount } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './utils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './utils/sdkConfigs';

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import SplitFactory from '../SplitFactory';
import SplitContext, { ISplitContextValues } from '../SplitContext';
import { WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from '../constants';
import { getClientWithStatus } from '../utils';

describe('SplitFactory', () => {

  test('passes no-ready props to the child if initialized with a config.', () => {
    shallow(
      <SplitFactory config={sdkBrowser} >
        {({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBeInstanceOf(Object);
          expect(isReady).toBe(false);
          expect(isTimedout).toBe(false);
          expect(lastUpdate).toBe(0);
          return null;
        }}
      </SplitFactory>);
  });

  test('passes ready props to the child if initialized with a ready factory.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    getClientWithStatus(outerFactory);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      shallow(
        <SplitFactory factory={outerFactory} >
          {({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
            expect(factory).toBe(outerFactory);
            expect(isReady).toBe(true);
            expect(isTimedout).toBe(false);
            expect(lastUpdate).toBe(0);
            return null;
          }}
        </SplitFactory>);
      done();
    });
  });

  test('rerender child on SDK_READY_TIMEDOUT, SDK_READY and SDK_UPDATE events.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    shallow(
      <SplitFactory factory={outerFactory} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>);

    setTimeout(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
      setTimeout(() => {
        (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
        setTimeout(() => {
          (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
          setTimeout(() => {
            expect(renderTimes).toBe(4);
            done();
          });
        });
      });
    });
  });

  test('rerender child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    shallow(
      <SplitFactory factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
          switch (renderTimes) {
            case 0: // No ready
              expect(isReady).toBe(false);
              expect(isTimedout).toBe(false);
              break;
            case 1: // Timedout
              expect(isReady).toBe(false);
              expect(isTimedout).toBe(true);
              break;
            case 2: // Updated. Although the SDK main client is ready, props are like timedout.
              expect(isReady).toBe(false);
              expect(isTimedout).toBe(true);
              break;
            default:
              fail('Child must not be rerendered');
          }
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>);

    setTimeout(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
      setTimeout(() => {
        (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
        setTimeout(() => {
          (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
          setTimeout(() => {
            expect(renderTimes).toBe(3);
            done();
          });
        });
      });
    });
  });

  test('rerender child only on SDK_READY event, as default behaviour.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    shallow(
      <SplitFactory factory={outerFactory} >
        {({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>);

    setTimeout(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
      setTimeout(() => {
        (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
        setTimeout(() => {
          (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
          setTimeout(() => {
            expect(renderTimes).toBe(2);
            done();
          });
        });
      });
    });

  });

  test('renders a passed JSX.Element with a new SplitContext value.', (done) => {
    const Component = () => {
      return (
        <SplitContext.Consumer>{(value: ISplitContextValues) => {
          expect(value.factory).toBeInstanceOf(Object);
          expect(value.client).toBe(value.factory?.client());
          expect(value.isReady).toBe(false);
          expect(value.isTimedout).toBe(false);
          expect(value.lastUpdate).toBe(0);
          done();
          return null;
        }}</SplitContext.Consumer>
      );
    };

    mount(
      <SplitFactory config={sdkBrowser} >
        <Component />
      </SplitFactory>);
  });

  test('logs warning if both a config and factory are passed as props.', () => {
    const logSpy = jest.spyOn(console, 'log');
    const outerFactory = SplitSdk(sdkBrowser);

    shallow(
      <SplitFactory config={sdkBrowser} factory={outerFactory} >
        {({ factory }) => {
          expect(factory).toBe(outerFactory);
          return null;
        }}
      </SplitFactory>);

    expect(logSpy).toBeCalledWith(WARN_SF_CONFIG_AND_FACTORY);
  });

  test('logs error and passes null factory if rendered without a Split config and factory.', () => {
    const errorSpy = jest.spyOn(console, 'error');
    mount(
      <SplitFactory>
        {({factory}) => {
          expect(factory).toBe(null);
          return null;
        }}
      </SplitFactory>);
    expect(errorSpy).toBeCalledWith(ERROR_SF_NO_CONFIG_AND_FACTORY);
  });

  /**
   * TODO other tests:
   * - multiple SplitFactory
   * - An SplitFactory inside another SplitFactory
   */

});
