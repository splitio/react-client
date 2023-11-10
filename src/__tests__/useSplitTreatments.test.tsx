import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
jest.mock('../constants', () => {
  const actual = jest.requireActual('../constants');
  return {
    ...actual,
    getControlTreatmentsWithConfig: jest.fn(actual.getControlTreatmentsWithConfig),
  };
});
import { CONTROL_WITH_CONFIG, getControlTreatmentsWithConfig } from '../constants';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { SplitFactory } from '../SplitFactory';
import { SplitClient } from '../SplitClient';
import { useSplitTreatments } from '../useSplitTreatments';
import { SplitTreatments } from '../SplitTreatments';
import { SplitContext } from '../SplitContext';
import { ISplitTreatmentsChildProps } from '../types';

describe('useSplitTreatments', () => {

  const featureFlagNames = ['split1'];
  const attributes = { att1: 'att1' };

  test('returns the treatments evaluated by the client at Split context updated by SplitFactory, or control if the client is not operational.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client();
    let treatments: SplitIO.TreatmentsWithConfig;

    render(
      <SplitFactory factory={outerFactory} >
        {React.createElement(() => {
          treatments = useSplitTreatments({ names: featureFlagNames, attributes }).treatments;
          return null;
        })}
      </SplitFactory>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL_WITH_CONFIG });

    // once operational (SDK_READY), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatmentsWithConfig).toBeCalledWith(featureFlagNames, attributes);
    expect(client.getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from the client at Split context updated by SplitClient, or control if the client is not operational.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let treatments: SplitIO.TreatmentsWithConfig;

    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >
          {React.createElement(() => {
            treatments = useSplitTreatments({ names: featureFlagNames, attributes }).treatments;
            return null;
          })}
        </SplitClient>
      </SplitFactory>
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL_WITH_CONFIG });

    // once operational (SDK_READY_FROM_CACHE), it evaluates feature flags
    act(() => client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));

    expect(client.getTreatmentsWithConfig).toBeCalledWith(featureFlagNames, attributes);
    expect(client.getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from a new client given a splitKey, and re-evaluates on SDK events.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let renderTimes = 0;

    render(
      <SplitFactory factory={outerFactory} >
        {React.createElement(() => {
          const treatments = useSplitTreatments({ names: featureFlagNames, attributes, splitKey: 'user2' }).treatments;

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
      </SplitFactory>
    );

    act(() => client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => client.__emitter__.emit(Event.SDK_READY));
    act(() => client.__emitter__.emit(Event.SDK_UPDATE)); // should not trigger a re-render by default
    expect(client.getTreatmentsWithConfig).toBeCalledTimes(2);
  });

  // THE FOLLOWING TEST WILL PROBABLE BE CHANGED BY 'return a null value or throw an error if it is not inside an SplitProvider'
  test('returns Control Treatments if invoked outside Split context.', () => {
    let treatments;

    render(
      React.createElement(() => {
        treatments = useSplitTreatments({ names: featureFlagNames, attributes }).treatments;
        return null;
      })
    );
    expect(getControlTreatmentsWithConfig).toBeCalledWith(featureFlagNames);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  /**
   * Input validation. Passing invalid feature flag names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  test('Input validation: invalid "names" and "attributes" params in useSplitTreatments.', () => {
    render(
      React.createElement(() => {
        // @ts-expect-error Test error handling
        let treatments = useSplitTreatments('split1').treatments;
        expect(treatments).toEqual({});
        // @ts-expect-error Test error handling
        treatments = useSplitTreatments({ names: [true] }).treatments;
        expect(treatments).toEqual({});

        return null;
      })
    );
    expect(logSpy).toBeCalledWith('[ERROR] split names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid split name, split name must be a non-empty string.');
  });

  test('useSplitTreatments must update on SDK events', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const mainClient = outerFactory.client() as any;
    const user2Client = outerFactory.client('user_2') as any;

    let countSplitContext = 0, countSplitTreatments = 0, countUseSplitTreatments = 0, countUseSplitTreatmentsUser2 = 0, countUseSplitTreatmentsUser2WithUpdate = 0;

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
      <SplitFactory factory={outerFactory} >
        <>
          <SplitContext.Consumer>
            {() => countSplitContext++}
          </SplitContext.Consumer>
          <SplitTreatments names={['split_test']}>
            {() => { countSplitTreatments++; return null }}
          </SplitTreatments>
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
            countUseSplitTreatmentsUser2++;
            return null;
          })}
          {React.createElement(() => {
            const context = useSplitTreatments({ names: ['split_test'], splitKey: 'user_2', updateOnSdkUpdate: true });
            expect(context.client).toBe(user2Client);
            validateTreatments(context);
            countUseSplitTreatmentsUser2WithUpdate++;
            return null;
          })}
        </>
      </SplitFactory>
    );

    act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => mainClient.__emitter__.emit(Event.SDK_READY));
    act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
    act(() => user2Client.__emitter__.emit(Event.SDK_READY));
    act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

    // SplitContext renders 3 times: initially, when ready from cache, and when ready.
    expect(countSplitContext).toEqual(3);

    // SplitTreatments and useSplitTreatments render when the context renders.
    expect(countSplitTreatments).toEqual(countSplitContext);
    expect(countUseSplitTreatments).toEqual(countSplitContext);
    expect(mainClient.getTreatmentsWithConfig).toHaveBeenCalledTimes(4);
    expect(mainClient.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], { att1: 'att1' });

    // If useSplitTreatments uses a different client than the context one, it renders when the context renders and when the new client is ready and ready from cache.
    expect(countUseSplitTreatmentsUser2).toEqual(countSplitContext + 2);
    // If it is used with `updateOnSdkUpdate: true`, it also renders when the client emits an SDK_UPDATE event.
    expect(countUseSplitTreatmentsUser2WithUpdate).toEqual(countSplitContext + 3);
    expect(user2Client.getTreatmentsWithConfig).toHaveBeenCalledTimes(5);
    expect(user2Client.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], undefined);
  });

});
