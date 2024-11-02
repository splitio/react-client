import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { CONTROL_WITH_CONFIG, EXCEPTION_NO_SFP } from '../constants';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useSplitTreatments } from '../useSplitTreatments';
import { SplitContext } from '../SplitContext';
import { ISplitTreatmentsChildProps } from '../types';

const logSpy = jest.spyOn(console, 'log');

describe('useSplitTreatments', () => {

  const featureFlagNames = ['split1'];
  const flagSets = ['set1'];
  const attributes = { att1: 'att1' };

  test('returns the treatments evaluated by the main client of the factory at Split context, or control if the client is not operational.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client();
    let treatments: SplitIO.TreatmentsWithConfig;
    let treatmentsByFlagSets: SplitIO.TreatmentsWithConfig;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          treatments = useSplitTreatments({ names: featureFlagNames, attributes }).treatments;
          treatmentsByFlagSets = useSplitTreatments({ flagSets, attributes }).treatments;

          // @ts-expect-error Options object must provide either names or flagSets
          expect(useSplitTreatments({}).treatments).toEqual({});
          return null;
        })}
      </SplitFactoryProvider>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL_WITH_CONFIG });

    // returns empty treatments object if not operational, without calling `getTreatmentsWithConfigByFlagSets` method
    expect(client.getTreatmentsWithConfigByFlagSets).not.toBeCalled();
    expect(treatmentsByFlagSets!).toEqual({});

    // once operational (SDK_READY), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatmentsWithConfig).toBeCalledWith(featureFlagNames, attributes);
    expect(client.getTreatmentsWithConfig).toHaveReturnedWith(treatments);

    expect(client.getTreatmentsWithConfigByFlagSets).toBeCalledWith(flagSets, attributes);
    expect(client.getTreatmentsWithConfigByFlagSets).toHaveReturnedWith(treatmentsByFlagSets);
  });

  test('returns the treatments from a new client given a splitKey, and re-evaluates on SDK events.', () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let renderTimes = 0;

    render(
      <SplitFactoryProvider factory={outerFactory} >
        {React.createElement(() => {
          const treatments = useSplitTreatments({ names: featureFlagNames, attributes, splitKey: 'user2', updateOnSdkUpdate: false }).treatments;

          renderTimes++;
          switch (renderTimes) {
            case 1:
              // returns control if not operational (SDK not ready), without calling `getTreatmentsWithConfig` method
              expect(client.getTreatmentsWithConfig).not.toBeCalled();
              expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG });
              break;
            case 2:
            case 3:
              // once operational (SDK_READY or SDK_READY_FROM_CACHE), it evaluates feature flags
              expect(client.getTreatmentsWithConfig).toHaveBeenLastCalledWith(featureFlagNames, attributes);
              expect(client.getTreatmentsWithConfig).toHaveLastReturnedWith(treatments);
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
    expect(client.getTreatmentsWithConfig).toBeCalledTimes(2);
  });

  test('throws error if invoked outside of SplitFactoryProvider.', () => {
    expect(() => {
      render(
        React.createElement(() => {
          useSplitTreatments({ names: featureFlagNames, attributes }).treatments;
          useSplitTreatments({ flagSets: featureFlagNames }).treatments;
          return null;
        })
      );
    }).toThrow(EXCEPTION_NO_SFP);
  });

  /**
   * Input validation. Passing invalid feature flag names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  test('Input validation: invalid "names" and "attributes" params in useSplitTreatments.', () => {
    render(
      <SplitFactoryProvider >
        {
          React.createElement(() => {
            // @ts-expect-error Test error handling
            let treatments = useSplitTreatments('split1').treatments;
            expect(treatments).toEqual({});
            // @ts-expect-error Test error handling
            treatments = useSplitTreatments({ names: [true] }).treatments;
            expect(treatments).toEqual({});

            return null;
          })
        }
      </SplitFactoryProvider>
    );
    expect(logSpy).toBeCalledWith('[ERROR] feature flag names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid feature flag name, feature flag name must be a non-empty string.');
  });

  test('useSplitTreatments must update on SDK events', async () => {
    const outerFactory = SplitFactory(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countUseSplitTreatments = 0, countUseSplitTreatmentsUser2 = 0, countUseSplitTreatmentsUser2WithoutUpdate = 0;
    const lastUpdateSetUser2 = new Set<number>();
    const lastUpdateSetUser2WithUpdate = new Set<number>();

    function validateTreatments({ treatments, isReady, isReadyFromCache }: ISplitTreatmentsChildProps) {
      if (isReady || isReadyFromCache) {
        expect(treatments).toEqual({
          split_test: {
            treatment: 'on',
            config: null,
          }
        })
      } else {
        expect(treatments).toEqual({
          split_test: {
            treatment: 'control',
            config: null,
          }
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
            const context = useSplitTreatments({ names: ['split_test'], attributes: { att1: 'att1' } });
            expect(context.client).toBe(mainClient); // Assert that the main client was retrieved.
            validateTreatments(context);
            countUseSplitTreatments++;
            return null;
          })}
          {React.createElement(() => {
            const context = useSplitTreatments({ names: ['split_test'], splitKey: 'user_2' });
            expect(context.client).toBe(user2Client);
            validateTreatments(context);
            lastUpdateSetUser2.add(context.lastUpdate);
            countUseSplitTreatmentsUser2++;
            return null;
          })}
          {React.createElement(() => {
            const context = useSplitTreatments({ names: ['split_test'], splitKey: 'user_2', updateOnSdkUpdate: false });
            expect(context.client).toBe(user2Client);
            validateTreatments(context);
            lastUpdateSetUser2WithUpdate.add(context.lastUpdate);
            countUseSplitTreatmentsUser2WithoutUpdate++;
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

    // If useSplitTreatments evaluates with the main client and have default update options, it re-renders for each main client event.
    expect(countUseSplitTreatments).toEqual(4);
    expect(mainClient.getTreatmentsWithConfig).toHaveBeenCalledTimes(3); // when ready from cache, ready and update
    expect(mainClient.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], { att1: 'att1' });

    // If useSplitTreatments evaluates with a different client and have default update options, it re-renders for each event of the new client.
    expect(countUseSplitTreatmentsUser2).toEqual(4);
    expect(lastUpdateSetUser2.size).toEqual(4);
    // If it is used with `updateOnSdkUpdate: false`, it doesn't render when the client emits an SDK_UPDATE event.
    expect(countUseSplitTreatmentsUser2WithoutUpdate).toEqual(3);
    expect(lastUpdateSetUser2WithUpdate.size).toEqual(3);
    expect(user2Client.getTreatmentsWithConfig).toHaveBeenCalledTimes(5); // when ready from cache x2, ready x2 and update x1
    expect(user2Client.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], undefined);
  });

  test('ignores flagSets and logs a warning if both names and flagSets params are provided.', () => {
    render(
      <SplitFactoryProvider >
        {
          React.createElement(() => {
            // @ts-expect-error names and flagSets are mutually exclusive
            const treatments = useSplitTreatments({ names: featureFlagNames, flagSets, attributes }).treatments;
            expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG });
            return null;
          })
        }
      </SplitFactoryProvider>
    );

    expect(logSpy).toHaveBeenLastCalledWith('[WARN]  Both names and flagSets properties were provided. flagSets will be ignored.');
  });

});
