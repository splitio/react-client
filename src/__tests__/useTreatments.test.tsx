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
import { useTreatments } from '../useTreatments';
import { SplitContext } from '../SplitContext';
import { IUseTreatmentsResult } from '../types';

describe('useTreatments', () => {

  const featureFlagNames = ['split1'];
  const flagSets = ['set1'];
  const attributes = { att1: 'att1' };
  const properties = { prop1: 'prop1' };

  test('returns the treatments evaluated by the main client of the factory at Split context, or control if the client is not operational.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client();
    let treatments: SplitIO.Treatments;
    let treatmentsByFlagSets: SplitIO.Treatments;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          treatments = useTreatments({ names: featureFlagNames, attributes, properties }).treatments;
          treatmentsByFlagSets = useTreatments({ flagSets, attributes, properties }).treatments;

          // @ts-expect-error Options object must provide either names or flagSets
          expect(useTreatments({}).treatments).toEqual({});
          return null;
        })}
      </SplitFactoryProvider>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatments` method
    expect(client.getTreatments).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL });

    // returns empty treatments object if not operational, without calling `getTreatmentsByFlagSets` method
    expect(client.getTreatmentsByFlagSets).not.toBeCalled();
    expect(treatmentsByFlagSets!).toEqual({});

    // once operational (SDK_READY), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatments).toBeCalledWith(featureFlagNames, attributes, { properties });
    expect(client.getTreatments).toHaveReturnedWith(treatments!);

    expect(client.getTreatmentsByFlagSets).toBeCalledWith(flagSets, attributes, { properties });
    expect(client.getTreatmentsByFlagSets).toHaveReturnedWith(treatmentsByFlagSets!);
  });

  test('returns the treatments from a new client given a splitKey, and re-evaluates on SDK events.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let renderTimes = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const treatments = useTreatments({ names: featureFlagNames, attributes, properties, splitKey: 'user2', updateOnSdkUpdate: false }).treatments;

          renderTimes++;
          switch (renderTimes) {
            case 1:
              // returns control if not operational (SDK not ready), without calling `getTreatments` method
              expect(client.getTreatments).not.toBeCalled();
              expect(treatments).toEqual({ split1: CONTROL });
              break;
            case 2:
            case 3:
              // once operational (SDK_READY or SDK_READY_FROM_CACHE), it evaluates feature flags
              expect(client.getTreatments).toHaveBeenLastCalledWith(featureFlagNames, attributes, { properties });
              expect(client.getTreatments).toHaveLastReturnedWith(treatments);
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
    expect(client.getTreatments).toBeCalledTimes(2);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useTreatments({ names: featureFlagNames, attributes }).treatments;
          useTreatments({ flagSets: featureFlagNames }).treatments;
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

  /**
   * Input validation: sanitize invalid feature flag names and return control while the SDK is not ready.
   */
  test('Input validation: invalid names are sanitized.', () => {
    render(
      <SplitFactoryProvider >
        {
          React.createElement(() => {
            // @ts-expect-error Test error handling
            let treatments = useTreatments('split1').treatments;
            expect(treatments).toEqual({});
            // @ts-expect-error Test error handling
            treatments = useTreatments({ names: [true, ' flag_1 ', ' '] }).treatments;
            expect(treatments).toEqual({ flag_1: CONTROL });

            return null;
          })
        }
      </SplitFactoryProvider>
    );
  });

  test('useTreatments must update on SDK events', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countUseTreatments = 0, countUseTreatmentsUser2 = 0, countUseTreatmentsUser2WithoutUpdate = 0;
    const lastUpdateSetUser2 = new Set<number>();
    const lastUpdateSetUser2WithUpdate = new Set<number>();

    function validateTreatments({ treatments, isReady, isReadyFromCache }: IUseTreatmentsResult) {
      if (isReady || isReadyFromCache) {
        expect(treatments).toEqual({
          split_test: 'on'
        })
      } else {
        expect(treatments).toEqual({
          split_test: 'control'
        })
      }
    }

    render(
      <SplitFactoryProvider factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          {React.createElement(() => {
            const context = useTreatments({ names: ['split_test'], attributes: { att1: 'att1' } });
            expect(context.client).toBe(mainClient); // Assert that the main client was retrieved.
            validateTreatments(context);
            countUseTreatments++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatments({ names: ['split_test'], splitKey: 'user_2' });
            expect(context.client).toBe(user2Client);
            validateTreatments(context);
            lastUpdateSetUser2.add(context.lastUpdate);
            countUseTreatmentsUser2++;
            return null;
          })}
          {React.createElement(() => {
            const context = useTreatments({ names: ['split_test'], splitKey: 'user_2', updateOnSdkUpdate: false });
            expect(context.client).toBe(user2Client);
            validateTreatments(context);
            lastUpdateSetUser2WithUpdate.add(context.lastUpdate);
            countUseTreatmentsUser2WithoutUpdate++;
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

    // If useTreatments evaluates with the main client and have default update options, it re-renders for each main client event.
    expect(countUseTreatments).toEqual(4);
    expect(mainClient.getTreatments).toHaveBeenCalledTimes(3); // when ready from cache, ready and update
    expect(mainClient.getTreatments).toHaveBeenLastCalledWith(['split_test'], { att1: 'att1' }, undefined);

    // If useTreatments evaluates with a different client and have default update options, it re-renders for each event of the new client.
    expect(countUseTreatmentsUser2).toEqual(4);
    expect(lastUpdateSetUser2.size).toEqual(4);
    // If it is used with `updateOnSdkUpdate: false`, it doesn't render when the client emits an SDK_UPDATE event.
    expect(countUseTreatmentsUser2WithoutUpdate).toEqual(3);
    expect(lastUpdateSetUser2WithUpdate.size).toEqual(3);
    expect(user2Client.getTreatments).toHaveBeenCalledTimes(5); // when ready from cache x2, ready x2 and update x1
    expect(user2Client.getTreatments).toHaveBeenLastCalledWith(['split_test'], undefined, undefined);
  });

  test('ignores flagSets if both names and flagSets params are provided.', () => {
    render(
      <SplitFactoryProvider >
        {
          React.createElement(() => {
            // @ts-expect-error names and flagSets are mutually exclusive
            const treatments = useTreatments({ names: featureFlagNames, flagSets, attributes }).treatments;
            expect(treatments).toEqual({ split1: CONTROL });
            return null;
          })
        }
      </SplitFactoryProvider>
    );
  });

});
