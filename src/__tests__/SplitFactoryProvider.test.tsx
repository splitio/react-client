import React from 'react';
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
import { __factories, IClientWithContext } from '../utils';
import { WARN_SF_CONFIG_AND_FACTORY } from '../constants';
import { INITIAL_STATUS } from './testUtils/utils';

describe('SplitFactoryProvider', () => {

  test('passes no-ready props to the child if initialized with a config.', () => {
    render(
      <SplitFactoryProvider config={sdkBrowser} >
        {React.createElement(() => {
          const context = useSplitContext();

          expect(context).toEqual({ factory: getLastInstance(SplitFactory) });
          return null;
        })}
      </SplitFactoryProvider>
    );
  });

  // test('passes ready props to the child if initialized with a ready factory.', async () => {
  //   const outerFactory = SplitFactory(sdkBrowser);
  //   (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
  //   (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
  //   (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
  //   await outerFactory.client().ready();

  //   render(
  //     <SplitFactoryProvider factory={outerFactory} >
  //       {(childProps: ISplitFactoryProviderChildProps) => {
  //         expect(childProps).toEqual({
  //           ...INITIAL_STATUS,
  //           factory: outerFactory,
  //           client: outerFactory.client(),
  //           isReady: true,
  //           isReadyFromCache: true,
  //           lastUpdate: (outerFactory.client() as IClientWithContext).__getStatus().lastUpdate
  //         });
  //         expect((childProps.factory as SplitIO.ISDK).settings.version).toBe(outerFactory.settings.version);
  //         return null;
  //       }}
  //     </SplitFactoryProvider>
  //   );
  // });

  test('logs warning if both a config and factory are passed as props.', () => {
    const outerFactory = SplitFactory(sdkBrowser);

    render(
      <SplitFactoryProvider config={sdkBrowser} factory={outerFactory} >
        {React.createElement(() => {
          return null;
        })}
      </SplitFactoryProvider>
    );

    expect(logSpy).toBeCalledWith(WARN_SF_CONFIG_AND_FACTORY);
    logSpy.mockRestore();
  });

  // test('cleans up on update and unmount if config prop is provided.', () => {
  //   let renderTimes = 0;
  //   const createdFactories = new Set<SplitIO.ISDK>();
  //   const clientDestroySpies: jest.SpyInstance[] = [];
  //   const outerFactory = SplitFactory(sdkBrowser);

  //   const Component = ({ factory, isReady, hasTimedout }: ISplitFactoryProviderChildProps) => {
  //     renderTimes++;

  //     switch (renderTimes) {
  //       case 1:
  //         expect(factory).toBe(outerFactory);
  //         return null;
  //       case 2:
  //       case 5:
  //         expect(isReady).toBe(false);
  //         expect(hasTimedout).toBe(false);
  //         expect(factory).toBe(getLastInstance(SplitFactory));
  //         return null;
  //       case 3:
  //       case 4:
  //       case 6:
  //         expect(isReady).toBe(true);
  //         expect(hasTimedout).toBe(true);
  //         expect(factory).toBe(getLastInstance(SplitFactory));
  //         createdFactories.add(factory!);
  //         clientDestroySpies.push(jest.spyOn(factory!.client(), 'destroy'));
  //         return (
  //           <SplitClient splitKey='other_key' >
  //             {({ client }) => {
  //               clientDestroySpies.push(jest.spyOn(client!, 'destroy'));
  //               return null;
  //             }}
  //           </SplitClient>
  //         );
  //       case 7:
  //         throw new Error('Must not rerender');
  //     }
  //   };

  //   const emitSdkEvents = () => {
  //     const factory = getLastInstance(SplitFactory);
  //     factory.client().__emitter__.emit(Event.SDK_READY_TIMED_OUT)
  //     factory.client().__emitter__.emit(Event.SDK_READY)
  //   };

  //   // 1st render: factory provided
  //   const wrapper = render(
  //     <SplitFactoryProvider factory={outerFactory} >
  //       {Component}
  //     </SplitFactoryProvider>
  //   );

  //   // 2nd render: factory created, not ready (null)
  //   wrapper.rerender(
  //     <SplitFactoryProvider config={sdkBrowser} >
  //       {Component}
  //     </SplitFactoryProvider>
  //   );

  //   // 3rd render: SDK ready (timeout is ignored due to updateOnSdkTimedout=false)
  //   act(emitSdkEvents);

  //   // 4th render: same config prop -> factory is not recreated
  //   wrapper.rerender(
  //     <SplitFactoryProvider config={sdkBrowser} updateOnSdkReady={false} updateOnSdkTimedout={true} >
  //       {Component}
  //     </SplitFactoryProvider>
  //   );

  //   act(emitSdkEvents); // Emitting events again has no effect
  //   expect(createdFactories.size).toBe(1);

  //   // 5th render: Update config prop -> factory is recreated, not ready yet (null)
  //   wrapper.rerender(
  //     <SplitFactoryProvider config={{ ...sdkBrowser }} updateOnSdkReady={false} updateOnSdkTimedout={true} >
  //       {Component}
  //     </SplitFactoryProvider>
  //   );

  //   // 6th render: SDK timeout (ready is ignored due to updateOnSdkReady=false)
  //   act(emitSdkEvents);

  //   wrapper.unmount();

  //   // Created factories are removed from `factories` cache and their clients are destroyed
  //   expect(createdFactories.size).toBe(2);
  //   expect(__factories.size).toBe(0);
  //   clientDestroySpies.forEach(spy => expect(spy).toBeCalledTimes(1));
  // });

  // test('doesn\'t clean up on unmount if the factory is provided as a prop.', () => {
  //   let destroyMainClientSpy;
  //   let destroySharedClientSpy;
  //   const outerFactory = SplitFactory(sdkBrowser);
  //   const wrapper = render(
  //     <SplitFactoryProvider factory={outerFactory}>
  //       {({ factory }) => {
  //         // if factory is provided as a prop, `factories` cache is not modified
  //         expect(__factories.size).toBe(0);
  //         destroyMainClientSpy = jest.spyOn(factory!.client(), 'destroy');
  //         return (
  //           <SplitClient splitKey='other_key' >
  //             {({ client }) => {
  //               destroySharedClientSpy = jest.spyOn(client!, 'destroy');
  //               return null;
  //             }}
  //           </SplitClient>
  //         );
  //       }}
  //     </SplitFactoryProvider>
  //   );
  //   wrapper.unmount();
  //   expect(destroyMainClientSpy).not.toBeCalled();
  //   expect(destroySharedClientSpy).not.toBeCalled();
  // });

});
