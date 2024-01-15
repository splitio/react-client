import React from 'react';
import { render, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';
import { __factories } from '../utils';
import { WARN_SF_CONFIG_AND_FACTORY } from '../constants';

describe('SplitFactoryProvider', () => {

  test('passes no-ready props to the child if initialized with a config.', () => {
    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {({ factory, client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBe(null);
          expect(client).toBe(null);
          expect(isReady).toBe(false);
          expect(isReadyFromCache).toBe(false);
          expect(hasTimedout).toBe(false);
          expect(isTimedout).toBe(false);
          expect(isDestroyed).toBe(false);
          expect(lastUpdate).toBe(0);
          return null;
        }}
      </SplitFactoryProvider>
    );
  });

  test('passes ready props to the child if initialized with a ready factory.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    await outerFactory.client().ready();

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBe(outerFactory);
          expect(isReady).toBe(true);
          expect(isReadyFromCache).toBe(true);
          expect(hasTimedout).toBe(false);
          expect(isTimedout).toBe(false);
          expect(isDestroyed).toBe(false);
          expect(lastUpdate).toBe(0);
          expect((factory as SplitIO.ISDK).settings.version).toBe(outerFactory.settings.version);
          return null;
        }}
      </SplitFactoryProvider>
    );
  });

  test('rerenders child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events (config prop)', async () => {
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider config={sdkBrowser} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          } // eslint-disable-next-line no-use-before-define
          if (factory) expect(factory).toBe(innerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    const innerFactory = (SplitSdk as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(5);
  });

  test('rerenders child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events (factory prop)', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(5);
  });

  test('rerenders child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY (config prop)', async () => {
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider config={sdkBrowser} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          } // eslint-disable-next-line no-use-before-define
          if (factory) expect(factory).toBe(innerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    const innerFactory = (SplitSdk as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(3);
  });

  test('rerenders child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY (factory prop)', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(3);
  });

  test('rerenders child only on SDK_READY and SDK_READY_FROM_CACHE event, as default behaviour (config prop)', async () => {
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          } // eslint-disable-next-line no-use-before-define
          if (factory) expect(factory).toBe(innerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    const innerFactory = (SplitSdk as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(2);
  });

  test('rerenders child only on SDK_READY and SDK_READY_FROM_CACHE event, as default behaviour (factory prop)', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
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
          expect(factory).toBe(outerFactory);
          expect(lastUpdate).toBeGreaterThan(previousLastUpdate);
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactoryProvider>
    );

    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(2);
  });

  test('renders a passed JSX.Element with a new SplitContext value.', (done) => {
    const Component = () => {
      return (
        <SplitContext.Consumer>
          {(value) => {
            expect(value.factory).toBe(null);
            expect(value.client).toBe(null);
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
      <SplitFactoryProvider config={sdkBrowser} >
        <Component />
      </SplitFactoryProvider>
    );
  });

  test('logs warning if both a config and factory are passed as props.', () => {
    const outerFactory = SplitSdk(sdkBrowser);

    render(
      <SplitFactoryProvider config={sdkBrowser} factory={outerFactory} >
        {({ factory }) => {
          expect(factory).toBe(outerFactory);
          return null;
        }}
      </SplitFactoryProvider>
    );

    expect(logSpy).toBeCalledWith(WARN_SF_CONFIG_AND_FACTORY);
    logSpy.mockRestore();
  });

  test('cleans up on update and unmount.', () => {
    let renderTimes = 0;
    const createdFactories = new Set<SplitIO.ISDK>();
    const clientDestroySpies: jest.SpyInstance[] = [];

    const Component = ({ factory, isReady, hasTimedout }: ISplitFactoryChildProps) => {
      renderTimes++;
      if (factory) createdFactories.add(factory);

      switch (renderTimes) {
        case 1:
        case 3:
          expect(isReady).toBe(false);
          expect(hasTimedout).toBe(false);
          expect(factory).toBe(null);
          return null;

        case 2:
        case 4:
          expect(isReady).toBe(true);
          expect(hasTimedout).toBe(true);
          expect(__factories.size).toBe(1);
          clientDestroySpies.push(jest.spyOn((factory as SplitIO.ISDK).client(), 'destroy'));
          return (
            <SplitClient splitKey='other_key' >
              {({ client }) => {
                clientDestroySpies.push(jest.spyOn(client as SplitIO.IClient, 'destroy'));
                return null;
              }}
            </SplitClient>
          );
        case 5:
          throw new Error('Child must not be rerendered');
      }
    };

    const emitSdkEvents = () => {
      const factory = (SplitSdk as jest.Mock).mock.results.slice(-1)[0].value;
      factory.client().__emitter__.emit(Event.SDK_READY_TIMED_OUT)
      factory.client().__emitter__.emit(Event.SDK_READY)
    };

    // 1st render
    const wrapper = render(
      <SplitFactoryProvider config={sdkBrowser} >
        {Component}
      </SplitFactoryProvider>
    );

    // 2nd render: SDK ready (timeout is ignored due to updateOnSdkTimedout=false)
    act(emitSdkEvents);

    // 3rd render: Update config prop -> factory is recreated
    wrapper.rerender(
      <SplitFactoryProvider config={{ ...sdkBrowser }} updateOnSdkReady={false} updateOnSdkTimedout={true} >
        {Component}
      </SplitFactoryProvider>
    );

    // 4th render: SDK timeout (ready is ignored due to updateOnSdkReady=false)
    act(emitSdkEvents);

    wrapper.unmount();

    // Created factories are removed from `factories` cache and their clients are destroyed
    expect(createdFactories.size).toBe(2);
    expect(__factories.size).toBe(0);
    clientDestroySpies.forEach(spy => expect(spy).toBeCalledTimes(1));
  });

  test('doesn\'t clean up on unmount if the factory is provided as a prop.', () => {
    let destroyMainClientSpy;
    let destroySharedClientSpy;
    const outerFactory = SplitSdk(sdkBrowser);
    const wrapper = render(
      <SplitFactoryProvider factory={outerFactory}>
        {({ factory }) => {
          // if factory is provided as a prop, `factories` cache is not modified
          expect(__factories.size).toBe(0);
          destroyMainClientSpy = jest.spyOn((factory as SplitIO.ISDK).client(), 'destroy');
          return (
            <SplitClient splitKey='other_key' >
              {({ client }) => {
                destroySharedClientSpy = jest.spyOn(client as SplitIO.IClient, 'destroy');
                return null;
              }}
            </SplitClient>
          );
        }}
      </SplitFactoryProvider>
    );
    wrapper.unmount();
    expect(destroyMainClientSpy).not.toBeCalled();
    expect(destroySharedClientSpy).not.toBeCalled();
  });

});
