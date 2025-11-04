import * as React from 'react';
import { render, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event, getLastInstance } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { SplitContext, useSplitContext } from '../SplitContext';
import { getStatus } from '../utils';
import { WARN_SF_CONFIG_AND_FACTORY } from '../constants';
import { INITIAL_STATUS } from './testUtils/utils';
import { useSplitClient } from '../useSplitClient';

describe('SplitFactoryProvider', () => {

  test('passes no-ready properties, no factory and no client to the context if initialized without a config and factory props.', () => {
    render(
      <SplitFactoryProvider >
        {React.createElement(() => {
          const context = useSplitContext();
          expect(context).toEqual({
            ...INITIAL_STATUS,
            factory: undefined,
            client: undefined,
          });
          return null;
        })}
      </SplitFactoryProvider>
    );
  });

  test('passes no-ready properties to the context if initialized with a config.', () => {
    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {React.createElement(() => {
          const context = useSplitContext();
          expect(context).toEqual({
            ...INITIAL_STATUS,
            factory: getLastInstance(SplitFactory),
            client: getLastInstance(SplitFactory).client(),
          });
          return null;
        })}
      </SplitFactoryProvider>
    );
  });

  test('passes ready properties to the context if initialized with a ready factory.', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    await outerFactory.client().ready();

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const context = useSplitClient();

          expect(context).toEqual({
            ...INITIAL_STATUS,
            factory: outerFactory,
            client: outerFactory.client(),
            isReady: true,
            isReadyFromCache: true,
            isOperational: true,
            lastUpdate: getStatus(outerFactory.client()).lastUpdate
          });
          return null;
        })}
      </SplitFactoryProvider>
    );
  });

  test('renders a passed JSX.Element with a new SplitContext value.', (done) => {
    const Component = () => {
      return (
        <SplitContext.Consumer>
          {(value) => {
            expect(value).toEqual({
              ...INITIAL_STATUS,
              factory: getLastInstance(SplitFactory),
              client: getLastInstance(SplitFactory).client(),
            });
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
        {React.createElement(() => {
          return null;
        })}
      </SplitFactoryProvider>
    );

    expect(logSpy).toBeCalledWith('[WARN]  splitio => ' + WARN_SF_CONFIG_AND_FACTORY);
    logSpy.mockRestore();
  });

  test('cleans up on update and unmount if config prop is provided.', () => {
    let renderTimes = 0;
    const createdFactories = new Set<SplitIO.IBrowserSDK>();
    const factoryDestroySpies: jest.SpyInstance[] = [];
    const outerFactory = SplitFactory(sdkBrowser);

    const Component = () => {
      const { factory, isReady, hasTimedout } = useSplitClient();
      renderTimes++;

      switch (renderTimes) {
        case 1:
          expect(factory).toBe(outerFactory);
          return null;
        case 2:
        case 5:
          expect(isReady).toBe(false);
          expect(hasTimedout).toBe(false);
          expect(factory).toBe(getLastInstance(SplitFactory));
          if (!createdFactories.has(factory!)) factoryDestroySpies.push(jest.spyOn(factory!, 'destroy'));
          createdFactories.add(factory!);
          return null;
        case 3:
        case 4:
        case 6:
          expect(isReady).toBe(true);
          expect(hasTimedout).toBe(true);
          expect(factory).toBe(getLastInstance(SplitFactory));
          if (!createdFactories.has(factory!)) factoryDestroySpies.push(jest.spyOn(factory!, 'destroy'));
          createdFactories.add(factory!);
          return null;
        case 7:
          throw new Error('Must not rerender');
      }
      return null;
    };

    const emitSdkEvents = () => {
      const factory = getLastInstance(SplitFactory);
      factory.client().__emitter__.emit(Event.SDK_READY_TIMED_OUT)
      factory.client().__emitter__.emit(Event.SDK_READY)
    };

    // 1st render: factory provided
    const wrapper = render(
      <SplitFactoryProvider factory={outerFactory} >
        <Component />
      </SplitFactoryProvider>
    );

    // 2nd render: factory created, not ready
    wrapper.rerender(
      <SplitFactoryProvider config={sdkBrowser} >
        <Component />
      </SplitFactoryProvider>
    );

    // 3rd render: SDK timeout and ready events emitted (only one re-render due to batched state updates in React)
    act(emitSdkEvents);

    // 4th render: same config prop -> factory is not recreated
    wrapper.rerender(
      <SplitFactoryProvider config={sdkBrowser}  >
        <Component />
      </SplitFactoryProvider>
    );

    act(emitSdkEvents); // Emitting events again has no effect
    expect(createdFactories.size).toBe(1);

    // 5th render: Update config prop -> factory is recreated, not ready yet
    wrapper.rerender(
      <SplitFactoryProvider config={{ ...sdkBrowser }} >
        <Component />
      </SplitFactoryProvider>
    );

    // 6th render: SDK events emitted
    act(emitSdkEvents);

    wrapper.unmount();

    // factory `destroy` methods are called
    expect(createdFactories.size).toBe(2);
    expect(factoryDestroySpies.length).toBe(2);
    factoryDestroySpies.forEach(spy => expect(spy).toBeCalledTimes(1));
  });

  test('doesn\'t clean up on unmount if the factory is provided as a prop.', () => {
    let destroySpy;
    const outerFactory = SplitFactory(sdkBrowser);
    const wrapper = render(
      <SplitFactoryProvider factory={outerFactory}>
        {React.createElement(() => {
          const { factory } = useSplitClient();
          destroySpy = jest.spyOn(factory!, 'destroy');
          return null;
        })}
      </SplitFactoryProvider>
    );
    wrapper.unmount();
    expect(destroySpy).not.toBeCalled();
  });

  test('passes attributes to the main client if provided.', () => {
    (SplitFactory as jest.Mock).mockClear();
    let client;

    const Component = () => {
      client = useSplitContext().client;
      return null;
    }

    const wrapper = render(
      <SplitFactoryProvider config={sdkBrowser} attributes={{ attr1: 'value1' }} >
        <Component />
      </SplitFactoryProvider>
    );

    expect(client.getAttributes()).toEqual({ attr1: 'value1' });

    wrapper.rerender(
      <SplitFactoryProvider config={sdkBrowser} attributes={{ attr1: 'value2' }} >
        <Component />
      </SplitFactoryProvider>
    );

    expect(client.getAttributes()).toEqual({ attr1: 'value2' });
    expect(SplitFactory).toBeCalledTimes(1);
  });

});
