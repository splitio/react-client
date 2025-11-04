import * as React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser, sdkBrowserWithConfig } from './testUtils/sdkConfigs';
import { CONTROL_WITH_CONFIG, EXCEPTION_NO_SFP } from '../constants';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useTreatmentWithConfig } from '../useTreatmentWithConfig';
import { SplitContext } from '../SplitContext';
import { IUseTreatmentWithConfigResult } from '../types';

describe('useTreatmentWithConfig', () => {

  const featureFlagName = 'split1';
  const attributes = { att1: 'att1' };
  const properties = { prop1: 'prop1' };

  test('returns the treatment evaluated by the main client of the factory at Split context, or control if the client is not operational.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client();
    let treatment: SplitIO.TreatmentWithConfig;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          treatment = useTreatmentWithConfig({ name: featureFlagName, attributes, properties }).treatment;
          return null;
        })}
      </SplitFactoryProvider>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentWithConfig` method
    expect(client.getTreatmentWithConfig).not.toBeCalled();
    expect(treatment!).toEqual(CONTROL_WITH_CONFIG);

    // once operational (SDK_READY), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatmentWithConfig).toBeCalledWith(featureFlagName, attributes, { properties });
    expect(client.getTreatmentWithConfig).toHaveReturnedWith(treatment!);
  });

  test('returns the treatments from a new client given a splitKey, and re-evaluates on SDK events.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let renderTimes = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const treatment = useTreatmentWithConfig({ name: featureFlagName, attributes, properties, splitKey: 'user2', updateOnSdkUpdate: false }).treatment;

          renderTimes++;
          switch (renderTimes) {
            case 1:
              // returns control if not operational (SDK not ready), without calling `getTreatmentWithConfig` method
              expect(client.getTreatmentWithConfig).not.toBeCalled();
              expect(treatment).toEqual(CONTROL_WITH_CONFIG);
              break;
            case 2:
            case 3:
              // once operational (SDK_READY or SDK_READY_FROM_CACHE), it evaluates feature flags
              expect(client.getTreatmentWithConfig).toHaveBeenLastCalledWith(featureFlagName, attributes, { properties });
              expect(client.getTreatmentWithConfig).toHaveLastReturnedWith(treatment);
              break;
            default:
              throw new Error('Unexpected render');
          }

          return null;
        })}
      </SplitFactoryProvider>
    );

    act(() => client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => client.__emitter__.emit(Event.SDK_READY));
    act(() => client.__emitter__.emit(Event.SDK_UPDATE));
    expect(client.getTreatmentWithConfig).toBeCalledTimes(2);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useTreatmentWithConfig({ name: featureFlagName, attributes }).treatment;
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

  test('must update on SDK events', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countUseTreatmentWithConfig = 0, countUseTreatmentWithConfigUser2 = 0, countUseTreatmentWithConfigUser2WithoutUpdate = 0;
    const lastUpdateSetUser2 = new Set<number>();
    const lastUpdateSetUser2WithUpdate = new Set<number>();

    function validateTreatment({ treatment, isReady, isReadyFromCache }: IUseTreatmentWithConfigResult) {
      if (isReady || isReadyFromCache) {
        expect(treatment).toEqual({ treatment: 'on', config: null })
      } else {
        expect(treatment).toEqual({ treatment: 'control', config: null })
      }
    }

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          {React.createElement(() => {
            const context = useTreatmentWithConfig({ name: 'split_test', attributes: { att1: 'att1' } });
            expect(context.client).toBe(mainClient); // Assert that the main client was retrieved.
            validateTreatment(context);
            countUseTreatmentWithConfig++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatmentWithConfig({ name: 'split_test', splitKey: 'user_2' });
            expect(context.client).toBe(user2Client);
            validateTreatment(context);
            lastUpdateSetUser2.add(context.lastUpdate);
            countUseTreatmentWithConfigUser2++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatmentWithConfig({ name: 'split_test', splitKey: 'user_2', updateOnSdkUpdate: false });
            expect(context.client).toBe(user2Client);
            validateTreatment(context);
            lastUpdateSetUser2WithUpdate.add(context.lastUpdate);
            countUseTreatmentWithConfigUser2WithoutUpdate++;
            return null;
          })}
        </>
      </SplitFactoryProvider>
    );

    act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => mainClient.__emitter__.emit(Event.SDK_READY));
    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY));
    act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

    // SplitFactoryProvider renders once
    expect(countSplitContext).toEqual(1);

    // If useTreatmentWithConfig evaluates with the main client and have default update options, it re-renders for each main client event.
    expect(countUseTreatmentWithConfig).toEqual(4);
    expect(mainClient.getTreatmentWithConfig).toHaveBeenCalledTimes(3); // when ready from cache, ready and update
    expect(mainClient.getTreatmentWithConfig).toHaveBeenLastCalledWith('split_test', { att1: 'att1' }, undefined);

    // If useTreatmentWithConfig evaluates with a different client and have default update options, it re-renders for each event of the new client.
    expect(countUseTreatmentWithConfigUser2).toEqual(4);
    expect(lastUpdateSetUser2.size).toEqual(4);
    // If it is used with `updateOnSdkUpdate: false`, it doesn't render when the client emits an SDK_UPDATE event.
    expect(countUseTreatmentWithConfigUser2WithoutUpdate).toEqual(3);
    expect(lastUpdateSetUser2WithUpdate.size).toEqual(3);
    expect(user2Client.getTreatmentWithConfig).toHaveBeenCalledTimes(5); // when ready from cache x2, ready x2 and update x1
    expect(user2Client.getTreatmentWithConfig).toHaveBeenLastCalledWith('split_test', undefined, undefined);
  });

  test('returns fallback treatment if the client is not operational', () => {
    render(
      <SplitFactoryProvider config={sdkBrowserWithConfig} >
        {React.createElement(() => {
          expect(useTreatmentWithConfig({ name: featureFlagName, attributes, properties }).treatment).toEqual({ treatment: 'control_global', config: null });
          expect(useTreatmentWithConfig({ name: 'ff1', attributes, properties }).treatment).toEqual({ treatment: 'control_ff1', config: 'control_ff1_config' });
          return null;
        })}
      </SplitFactoryProvider>
    );
  });

});
