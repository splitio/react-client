import * as React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { CONTROL, EXCEPTION_NO_SFP } from '../constants';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useTreatment } from '../useTreatment';
import { SplitContext } from '../SplitContext';
import { IUseTreatmentResult } from '../types';

describe('useTreatment', () => {

  const featureFlagName = 'split1';
  const attributes = { att1: 'att1' };
  const properties = { prop1: 'prop1' };

  test('returns the treatment evaluated by the main client of the factory at Split context, or control if the client is not operational.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client();
    let treatment: SplitIO.Treatment;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          treatment = useTreatment({ name: featureFlagName, attributes, properties }).treatment;
          return null;
        })}
      </SplitFactoryProvider>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatment` method
    expect(client.getTreatment).not.toBeCalled();
    expect(treatment!).toEqual(CONTROL);

    // once operational (SDK_READY), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatment).toBeCalledWith(featureFlagName, attributes, { properties });
    expect(client.getTreatment).toHaveReturnedWith(treatment!);
  });

  test('returns the treatments from a new client given a splitKey, and re-evaluates on SDK events.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let renderTimes = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const treatment = useTreatment({ name: featureFlagName, attributes, properties, splitKey: 'user2', updateOnSdkUpdate: false }).treatment;

          renderTimes++;
          switch (renderTimes) {
            case 1:
              // returns control if not operational (SDK not ready), without calling `getTreatment` method
              expect(client.getTreatment).not.toBeCalled();
              expect(treatment).toEqual(CONTROL);
              break;
            case 2:
            case 3:
              // once operational (SDK_READY or SDK_READY_FROM_CACHE), it evaluates feature flags
              expect(client.getTreatment).toHaveBeenLastCalledWith(featureFlagName, attributes, { properties });
              expect(client.getTreatment).toHaveLastReturnedWith(treatment);
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
    expect(client.getTreatment).toBeCalledTimes(2);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useTreatment({ name: featureFlagName, attributes }).treatment;
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

  test('useTreatment must update on SDK events', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countUseTreatment = 0, countUseTreatmentUser2 = 0, countUseTreatmentUser2WithoutUpdate = 0;
    const lastUpdateSetUser2 = new Set<number>();
    const lastUpdateSetUser2WithUpdate = new Set<number>();

    function validateTreatment({ treatment, isReady, isReadyFromCache }: IUseTreatmentResult) {
      if (isReady || isReadyFromCache) {
        expect(treatment).toEqual('on')
      } else {
        expect(treatment).toEqual('control')
      }
    }

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          {React.createElement(() => {
            const context = useTreatment({ name: 'split_test', attributes: { att1: 'att1' } });
            expect(context.client).toBe(mainClient); // Assert that the main client was retrieved.
            validateTreatment(context);
            countUseTreatment++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatment({ name: 'split_test', splitKey: 'user_2' });
            expect(context.client).toBe(user2Client);
            validateTreatment(context);
            lastUpdateSetUser2.add(context.lastUpdate);
            countUseTreatmentUser2++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatment({ name: 'split_test', splitKey: 'user_2', updateOnSdkUpdate: false });
            expect(context.client).toBe(user2Client);
            validateTreatment(context);
            lastUpdateSetUser2WithUpdate.add(context.lastUpdate);
            countUseTreatmentUser2WithoutUpdate++;
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

    // If useTreatment evaluates with the main client and have default update options, it re-renders for each main client event.
    expect(countUseTreatment).toEqual(4);
    expect(mainClient.getTreatment).toHaveBeenCalledTimes(3); // when ready from cache, ready and update
    expect(mainClient.getTreatment).toHaveBeenLastCalledWith('split_test', { att1: 'att1' }, undefined);

    // If useTreatment evaluates with a different client and have default update options, it re-renders for each event of the new client.
    expect(countUseTreatmentUser2).toEqual(4);
    expect(lastUpdateSetUser2.size).toEqual(4);
    // If it is used with `updateOnSdkUpdate: false`, it doesn't render when the client emits an SDK_UPDATE event.
    expect(countUseTreatmentUser2WithoutUpdate).toEqual(3);
    expect(lastUpdateSetUser2WithUpdate.size).toEqual(3);
    expect(user2Client.getTreatment).toHaveBeenCalledTimes(5); // when ready from cache x2, ready x2 and update x1
    expect(user2Client.getTreatment).toHaveBeenLastCalledWith('split_test', undefined, undefined);
  });

});
