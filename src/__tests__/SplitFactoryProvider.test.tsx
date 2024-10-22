import React from 'react';
import { render, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { ISplitFactoryProviderChildProps } from '../types';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';
import { __factories, IClientWithContext } from '../utils';
import { WARN_SF_CONFIG_AND_FACTORY } from '../constants';
import { INITIAL_CONTEXT } from './testUtils/utils';

describe('SplitFactoryProvider', () => {

  test('passes no-ready props to the child if initialized with a config.', () => {
    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {(childProps: ISplitFactoryProviderChildProps) => {
          expect(childProps).toEqual(INITIAL_CONTEXT);
          return null;
        }}
      </SplitFactoryProvider>
    );
  });

  test('passes ready props to the child if initialized with a ready factory.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    await outerFactory.client().ready();

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {(childProps: ISplitFactoryProviderChildProps) => {
          expect(childProps).toEqual({
            ...INITIAL_CONTEXT,
            factory: outerFactory,
            client: outerFactory.client(),
            isReady: true,
            isReadyFromCache: true,
            lastUpdate: (outerFactory.client() as IClientWithContext).__getStatus().lastUpdate
          });
          expect((childProps.factory as SplitIO.IBrowserSDK).settings.version).toBe(outerFactory.settings.version);
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
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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

    const innerFactory = (SplitFactory as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(5);
  });

  test('rerenders child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events (factory prop)', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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

    const innerFactory = (SplitFactory as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    expect(renderTimes).toBe(3);
  });

  test('rerenders child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY (factory prop)', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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

  test('rerenders child only on SDK_READY and SDK_READY_FROM_CACHE event, as default behavior (config prop)', async () => {
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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

    const innerFactory = (SplitFactory as jest.Mock).mock.results.slice(-1)[0].value;
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (innerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(2);
  });

  test('rerenders child only on SDK_READY and SDK_READY_FROM_CACHE event, as default behavior (factory prop)', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, lastUpdate }: ISplitFactoryProviderChildProps) => {
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
            expect(value).toEqual(INITIAL_CONTEXT);
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
    const outerFactory = SplitFactory(sdkBrowser);

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

  test('cleans up on update and unmount if config prop is provided.', () => {
    let renderTimes = 0;
    const createdFactories = new Set<SplitIO.IBrowserSDK<SplitIO.IEventEmitter>>();
    const clientDestroySpies: jest.SpyInstance[] = [];
    const outerFactory = SplitFactory(sdkBrowser);

    const Component = ({ factory, isReady, hasTimedout }: ISplitFactoryProviderChildProps) => {
      renderTimes++;

      switch (renderTimes) {
        case 1:
          expect(factory).toBe(outerFactory);
          return null;
        case 2:
        case 5:
          expect(isReady).toBe(false);
          expect(hasTimedout).toBe(false);
          expect(factory).toBe(undefined);
          return null;
        case 3:
        case 4:
        case 6:
          expect(isReady).toBe(true);
          expect(hasTimedout).toBe(true);
          expect(factory).not.toBe(undefined);
          createdFactories.add(factory!);
          clientDestroySpies.push(jest.spyOn(factory!.client(), 'destroy'));
          return (
            <SplitClient splitKey='other_key' >
              {({ client }) => {
                clientDestroySpies.push(jest.spyOn(client!, 'destroy'));
                return null;
              }}
            </SplitClient>
          );
        case 7:
          throw new Error('Must not rerender');
      }
    };

    const emitSdkEvents = () => {
      const factory = (SplitFactory as jest.Mock).mock.results.slice(-1)[0].value;
      factory.client().__emitter__.emit(Event.SDK_READY_TIMED_OUT)
      factory.client().__emitter__.emit(Event.SDK_READY)
    };

    // 1st render: factory provided
    const wrapper = render(
      <SplitFactoryProvider factory={outerFactory} >
        {Component}
      </SplitFactoryProvider>
    );

    // 2nd render: factory created, not ready (null)
    wrapper.rerender(
      <SplitFactoryProvider config={sdkBrowser} >
        {Component}
      </SplitFactoryProvider>
    );

    // 3rd render: SDK ready (timeout is ignored due to updateOnSdkTimedout=false)
    act(emitSdkEvents);

    // 4th render: same config prop -> factory is not recreated
    wrapper.rerender(
      <SplitFactoryProvider config={sdkBrowser} updateOnSdkReady={false} updateOnSdkTimedout={true} >
        {Component}
      </SplitFactoryProvider>
    );

    act(emitSdkEvents); // Emitting events again has no effect
    expect(createdFactories.size).toBe(1);

    // 5th render: Update config prop -> factory is recreated, not ready yet (null)
    wrapper.rerender(
      <SplitFactoryProvider config={{ ...sdkBrowser }} updateOnSdkReady={false} updateOnSdkTimedout={true} >
        {Component}
      </SplitFactoryProvider>
    );

    // 6th render: SDK timeout (ready is ignored due to updateOnSdkReady=false)
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
    const outerFactory = SplitFactory(sdkBrowser);
    const wrapper = render(
      <SplitFactoryProvider factory={outerFactory}>
        {({ factory }) => {
          // if factory is provided as a prop, `factories` cache is not modified
          expect(__factories.size).toBe(0);
          destroyMainClientSpy = jest.spyOn(factory!.client(), 'destroy');
          return (
            <SplitClient splitKey='other_key' >
              {({ client }) => {
                destroySharedClientSpy = jest.spyOn(client!, 'destroy');
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
