import React from 'react';
import { act, render, RenderResult } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { CONTROL_WITH_CONFIG, EXCEPTION_NO_SFP } from '../constants';
import { newSplitFactoryLocalhostInstance } from './testUtils/utils';

/** Test target */
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { useSplitTreatments } from '../useSplitTreatments';
import { SplitContext } from '../SplitContext';
import { ISplitFactoryProviderProps, IUseSplitTreatmentsOptions, IUseSplitTreatmentsResult } from '../types';

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

    function validateTreatments({ treatments, isReady, isReadyFromCache }: IUseSplitTreatmentsResult) {
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

let renderTimes = 0;

/**
 * Tests for asserting that client.getTreatmentsWithConfig and client.getTreatmentsWithConfigByFlagSets are not called unnecessarily when using useSplitTreatments.
 */
describe('useSplitTreatments optimization', () => {
  let outerFactory = SplitFactory(sdkBrowser);
  (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);

  function InnerComponent({ names, flagSets, attributes, splitKey }: {
    names?: IUseSplitTreatmentsOptions['names']
    flagSets?: IUseSplitTreatmentsOptions['flagSets']
    attributes?: IUseSplitTreatmentsOptions['attributes']
    splitKey?: IUseSplitTreatmentsOptions['splitKey']
  }) { // @ts-expect-error names and flagSets are mutually exclusive
    useSplitTreatments({ names, flagSets, attributes, splitKey });
    renderTimes++;
    return null;
  }

  function Component({ names, flagSets, attributes, splitKey, clientAttributes }: {
    names?: IUseSplitTreatmentsOptions['names']
    flagSets?: IUseSplitTreatmentsOptions['flagSets']
    attributes: IUseSplitTreatmentsOptions['attributes']
    splitKey?: IUseSplitTreatmentsOptions['splitKey']
    clientAttributes?: ISplitFactoryProviderProps['attributes']
  }) {
    return (
      <SplitFactoryProvider factory={outerFactory} attributes={clientAttributes} >
        <InnerComponent names={names} attributes={attributes} flagSets={flagSets} splitKey={splitKey} />
      </SplitFactoryProvider>
    );
  }

  const names = ['split1', 'split2'];
  const flagSets = ['set1', 'set2'];
  const attributes = { att1: 'att1' };
  const splitKey = sdkBrowser.core.key;

  let wrapper: RenderResult;

  beforeEach(() => {
    renderTimes = 0;
    (outerFactory.client().getTreatmentsWithConfig as jest.Mock).mockClear();
    wrapper = render(<Component names={names} flagSets={flagSets} attributes={attributes} splitKey={splitKey} />);
  })

  afterEach(() => {
    wrapper.unmount(); // unmount to remove event listener from factory
  })

  test('rerenders but does not re-evaluate feature flags if client, lastUpdate, names, flagSets and attributes are the same object.', () => {
    wrapper.rerender(<Component names={names} flagSets={flagSets} attributes={attributes} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  test('rerenders but does not re-evaluate feature flags if client, lastUpdate, names, flagSets and attributes are equals (shallow comparison).', () => {
    wrapper.rerender(<Component names={[...names]} flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  test('rerenders and re-evaluates feature flags if names are not equals (shallow array comparison).', () => {
    wrapper.rerender(<Component names={[...names, 'split3']} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  test('rerenders and re-evaluates feature flags if flag sets are not equals (shallow array comparison).', () => {
    wrapper.rerender(<Component flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);
    wrapper.rerender(<Component flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(1);

    wrapper.rerender(<Component flagSets={[...flagSets, 'split3']} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(4);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(2);
  });

  test('rerenders and re-evaluates feature flags if attributes are not equals (shallow object comparison).', () => {
    const attributesRef = { ...attributes, att2: 'att2' };
    wrapper.rerender(<Component names={[...names]} attributes={attributesRef} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);

    // If passing same reference but mutated (bad practice), the component re-renders but doesn't re-evaluate feature flags
    attributesRef.att2 = 'att2_val2';
    wrapper.rerender(<Component names={[...names]} attributes={attributesRef} splitKey={splitKey} />);
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
  });

  test('rerenders and re-evaluates feature flags if lastUpdate timestamp changes (e.g., SDK_UPDATE event).', () => {
    expect(renderTimes).toBe(1);

    // State update and split evaluation
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    // State update after destroy doesn't re-evaluate because the sdk is not operational
    (outerFactory as any).client().destroy();
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={splitKey} />);

    // Updates were batched as a single render, due to automatic batching https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);

    // Restore the client to be READY
    (outerFactory as any).client().__restore();
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
  });

  test('rerenders and re-evaluates feature flags if client changes.', async () => {
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'otherKey'} />);
    await act(() => (outerFactory as any).client('otherKey').__emitter__.emit(Event.SDK_READY));

    // Initial render + 2 renders (in 3 updates) -> automatic batching https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client('otherKey').getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  test('rerenders and re-evaluates feature flags if client attributes changes.', (done) => {
    const originalFactory = outerFactory;
    outerFactory = newSplitFactoryLocalhostInstance();

    const client = outerFactory.client();
    const clientSpy = {
      getTreatmentsWithConfig: jest.spyOn(client, 'getTreatmentsWithConfig')
    }

    client.on(client.Event.SDK_READY, () => {
      wrapper = render(<Component names={names} attributes={attributes} />);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(1);
      wrapper.rerender(<Component names={names} attributes={attributes} clientAttributes={{ att2: 'att1_val1' }} />);
      expect(renderTimes).toBe(3);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(2);

      wrapper.rerender(<Component names={names} attributes={attributes} clientAttributes={{ att2: 'att1_val2' }} />);
      expect(renderTimes).toBe(4);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3);

      wrapper.rerender(<Component names={names} attributes={attributes} clientAttributes={{ att2: 'att1_val2' }} />);
      expect(renderTimes).toBe(5);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3); // not called again. clientAttributes object is shallow equal

      outerFactory = originalFactory;
      client.destroy().then(done)
    })
  });

});
