import React from 'react';
import { render, act } from '@testing-library/react';

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
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import useTreatments from '../useTreatments';

describe('useTreatments', () => {

  const splitNames = ['split1'];
  const attributes = { att1: 'att1' };

  test('returns the treatments evaluated by the client at Split context updated by SplitFactory, or control if the client is not operational.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client();
    let treatments: SplitIO.TreatmentsWithConfig;

    render(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatments = useTreatments(splitNames, attributes);
          return null;
        })}</SplitFactory>,
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL_WITH_CONFIG });

    // once operational (SDK_READY), it evaluates splits
    act(() => client.__emitter__.emit(Event.SDK_READY));

    expect(client.getTreatmentsWithConfig).toBeCalledWith(splitNames, attributes);
    expect(client.getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from the client at Split context updated by SplitClient, or control if the client is not operational.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let treatments: SplitIO.TreatmentsWithConfig;

    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >{
          React.createElement(() => {
            treatments = useTreatments(splitNames, attributes);
            return null;
          })}
        </SplitClient>
      </SplitFactory>,
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments!).toEqual({ split1: CONTROL_WITH_CONFIG });

    // once operational (SDK_READY_FROM_CACHE), it evaluates splits
    act(() => client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));

    expect(client.getTreatmentsWithConfig).toBeCalledWith(splitNames, attributes);
    expect(client.getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from a new client given a splitKey, or control if the client is not operational.', async () => {
    const outerFactory = SplitSdk(sdkBrowser);
    const client: any = outerFactory.client('user2');
    let treatments;

    client.__emitter__.emit(Event.SDK_READY);
    await client.destroy();

    render(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatments = useTreatments(splitNames, attributes, 'user2');
          return null;
        })}
      </SplitFactory>,
    );

    // returns control treatment if not operational (SDK not ready or destroyed), without calling `getTreatmentsWithConfig` method
    expect(client.getTreatmentsWithConfig).not.toBeCalled();
    expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG });
  });

  // THE FOLLOWING TEST WILL PROBABLE BE CHANGED BY 'return a null value or throw an error if it is not inside an SplitProvider'
  test('returns Control Treatments if invoked outside Split context.', () => {
    let treatments;

    render(
      React.createElement(
        () => {
          treatments = useTreatments(splitNames, attributes);
          return null;
        }),
    );
    expect(getControlTreatmentsWithConfig).toBeCalledWith(splitNames);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  /**
   * Input validation. Passing invalid split names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  test('Input validation: invalid "names" and "attributes" params in useTreatments.', (done) => {
    render(
      React.createElement(
        () => {
          // @ts-expect-error Test error handling
          let treatments = useTreatments('split1');
          expect(treatments).toEqual({});
          // @ts-expect-error Test error handling
          treatments = useTreatments([true]);
          expect(treatments).toEqual({});

          done();
          return null;
        }),
    );
    expect(logSpy).toBeCalledWith('[ERROR] split names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid split name, split name must be a non-empty string.');
  });

});
