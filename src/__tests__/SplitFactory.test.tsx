import React from 'react';
import { render, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event, assertNoListeners } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import { SplitFactory } from '../SplitFactory';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';
import { __factories } from '../utils';
import { WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from '../constants';

describe('SplitFactory', () => {

  test('passes no-ready props to the child if initialized with a config.', () => {
    render(
      <SplitFactory config={sdkBrowser} >
        {({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBeInstanceOf(Object);
          expect(isReady).toBe(false);
          expect(isReadyFromCache).toBe(false);
          expect(hasTimedout).toBe(false);
          expect(isTimedout).toBe(false);
          expect(isDestroyed).toBe(false);
          expect(lastUpdate).toBe(0);
          expect((factory as SplitIO.ISDK).settings.version).toContain('react-');
          return null;
        }}
      </SplitFactory>
    );
  });

  test('passes ready props to the child if initialized with a ready factory.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    (outerFactory.manager().names as jest.Mock).mockReturnValue(['split1']);
    await outerFactory.client().ready();

    render(
      <SplitFactory factory={outerFactory} >
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
      </SplitFactory>
    );
  });

  test('rerenders child on SDK_READY_TIMEDOUT, SDK_READY_FROM_CACHE, SDK_READY and SDK_UPDATE events.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    const wrapper = render(
      <SplitFactory factory={outerFactory} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
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
          expect(lastUpdate).toBeGreaterThanOrEqual(previousLastUpdate);
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>
    );

    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(5);

    // check that outerFactory's clients have no event listeners
    wrapper.unmount();
    assertNoListeners(outerFactory);
  });

  test('rerenders child on SDK_READY_TIMED_OUT and SDK_UPDATE events, but not on SDK_READY.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    const wrapper = render(
      <SplitFactory factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
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
          expect(lastUpdate).toBeGreaterThanOrEqual(previousLastUpdate);
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>
    );

    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_READY));
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));
    expect(renderTimes).toBe(3);

    // check that outerFactory's clients have no event listeners
    wrapper.unmount();
    assertNoListeners(outerFactory);
  });

  test('rerenders child only on SDK_READY and SDK_READY_FROM_CACHE event, as default behaviour.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimes = 0;
    let previousLastUpdate = -1;

    render(
      <SplitFactory factory={outerFactory} >
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
          expect(lastUpdate).toBeLessThanOrEqual(Date.now());
          renderTimes++;
          previousLastUpdate = lastUpdate;
          return null;
        }}
      </SplitFactory>
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
            expect(value.factory).toBeInstanceOf(Object);
            expect(value.client).toBe(value.factory?.client());
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
      <SplitFactory config={sdkBrowser} >
        <Component />
      </SplitFactory>
    );
  });

  test('logs warning if both a config and factory are passed as props.', () => {
    const outerFactory = SplitSdk(sdkBrowser);

    render(
      <SplitFactory config={sdkBrowser} factory={outerFactory} >
        {({ factory }) => {
          expect(factory).toBe(outerFactory);
          return null;
        }}
      </SplitFactory>
    );

    expect(logSpy).toBeCalledWith(WARN_SF_CONFIG_AND_FACTORY);
    logSpy.mockRestore();
  });

  test('logs error and passes null factory if rendered without a Split config and factory.', () => {
    const errorSpy = jest.spyOn(console, 'error');
    render(
      <SplitFactory>
        {({ factory }) => {
          expect(factory).toBe(null);
          return null;
        }}
      </SplitFactory>
    );
    expect(errorSpy).toBeCalledWith(ERROR_SF_NO_CONFIG_AND_FACTORY);
  });

  test('cleans up on unmount.', () => {
    let destroyMainClientSpy;
    let destroySharedClientSpy;
    const wrapper = render(
      <SplitFactory config={sdkBrowser} >
        {({ factory }) => {
          expect(__factories.size).toBe(1);
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
      </SplitFactory>
    );
    wrapper.unmount();
    // the factory created by the component is removed from `factories` cache and its clients are destroyed
    expect(__factories.size).toBe(0);
    expect(destroyMainClientSpy).toBeCalledTimes(1);
    expect(destroySharedClientSpy).toBeCalledTimes(1);
  });

  test('doesn\'t clean up on unmount if the factory is provided as a prop.', () => {
    let destroyMainClientSpy;
    let destroySharedClientSpy;
    const outerFactory = SplitSdk(sdkBrowser);
    const wrapper = render(
      <SplitFactory factory={outerFactory}>
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
      </SplitFactory>
    );
    wrapper.unmount();
    expect(destroyMainClientSpy).not.toBeCalled();
    expect(destroySharedClientSpy).not.toBeCalled();
  });

});
