import React from 'react';
import { render, RenderResult, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
import { getStatus } from '../utils';
import { newSplitFactoryLocalhostInstance } from './testUtils/utils';
import { CONTROL_WITH_CONFIG, WARN_ST_NO_CLIENT } from '../constants';

/** Test target */
import { ISplitTreatmentsChildProps, ISplitTreatmentsProps, ISplitClientProps } from '../types';
import { SplitTreatments } from '../SplitTreatments';
import { SplitClient } from '../SplitClient';
import { SplitFactory } from '../SplitFactory';
import { useSplitTreatments } from '../useSplitTreatments';

const logSpy = jest.spyOn(console, 'log');

describe('SplitTreatments', () => {

  const featureFlagNames = ['split1', 'split2'];
  const flagSets = ['set1', 'set2'];

  afterEach(() => { logSpy.mockClear() });

  it('passes control treatments (empty object if flagSets is provided) if the SDK is not ready.', () => {
    render(
      <SplitFactory config={sdkBrowser} >
        {({ factory }) => {
          return (
            <SplitClient splitKey='user1' >
              <SplitTreatments names={featureFlagNames} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client('user1');
                  expect(clientMock.getTreatmentsWithConfig).not.toBeCalled();
                  expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG, split2: CONTROL_WITH_CONFIG });
                  return null;
                }}
              </SplitTreatments>
              <SplitTreatments flagSets={flagSets} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client('user1');
                  expect(clientMock.getTreatmentsWithConfigByFlagSets).not.toBeCalled();
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
            </SplitClient>
          );
        }}
      </SplitFactory>
    );
  });

  it('passes as treatments prop the value returned by the method "client.getTreatmentsWithConfig(ByFlagSets)" if the SDK is ready.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);

    render(
      <SplitFactory factory={outerFactory} >
        {({ factory, isReady }) => {
          expect(getStatus(outerFactory.client()).isReady).toBe(isReady);
          expect(isReady).toBe(true);
          return (
            <>
              <SplitTreatments names={featureFlagNames} >
                {({ treatments, isReady: isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client();
                  expect(clientMock.getTreatmentsWithConfig.mock.calls.length).toBe(1);
                  expect(treatments).toBe(clientMock.getTreatmentsWithConfig.mock.results[0].value);
                  expect(featureFlagNames).toBe(clientMock.getTreatmentsWithConfig.mock.calls[0][0]);
                  expect([isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([true, false, false, false, false, 0]);
                  return null;
                }}
              </SplitTreatments>
              <SplitTreatments flagSets={flagSets} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client();
                  expect(clientMock.getTreatmentsWithConfigByFlagSets.mock.calls.length).toBe(1);
                  expect(treatments).toBe(clientMock.getTreatmentsWithConfigByFlagSets.mock.results[0].value);
                  expect(flagSets).toBe(clientMock.getTreatmentsWithConfigByFlagSets.mock.calls[0][0]);
                  return null;
                }}
              </SplitTreatments>
            </>
          );
        }}
      </SplitFactory>
    );
  });

  it('logs error and passes control treatments if rendered outside an SplitProvider component.', () => {
    render(
      <SplitTreatments names={featureFlagNames} >
        {({ treatments }: ISplitTreatmentsChildProps) => {
          expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG, split2: CONTROL_WITH_CONFIG });
          return null;
        }}
      </SplitTreatments>
    );

    expect(logSpy).toBeCalledWith(WARN_ST_NO_CLIENT);
  });

  /**
   * Input validation. Passing invalid feature flag names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  it('Input validation: invalid "names" and "attributes" props in SplitTreatments.', (done) => {
    render(
      <SplitFactory config={sdkBrowser} >
        {() => {
          return (
            <>
              {/* @ts-expect-error Test error handling */}
              <SplitTreatments split_names={featureFlagNames} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
              {/* @ts-expect-error Test error handling */}
              <SplitTreatments names={featureFlagNames[0]} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
              {/* @ts-expect-error Test error handling */}
              <SplitTreatments names={[true]} attributes={'invalid'} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
            </>
          );
        }}
      </SplitFactory>
    );
    expect(logSpy).toBeCalledWith('[ERROR] feature flag names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid feature flag name, feature flag name must be a non-empty string.');

    done();
  });


  test('ignores flagSets and logs a warning if both names and flagSets params are provided.', () => {
    render(
      // @ts-expect-error flagSets and names are mutually exclusive
      <SplitTreatments names={featureFlagNames} flagSets={flagSets} >
        {({ treatments }) => {
          expect(treatments).toEqual({ split1: CONTROL_WITH_CONFIG, split2: CONTROL_WITH_CONFIG });
          return null;
        }}
      </SplitTreatments>
    );

    expect(logSpy).toBeCalledWith('[WARN]  Both names and flagSets props were provided. flagSets will be ignored.');
  });
});

let renderTimes = 0;

/**
 * Tests for asserting that client.getTreatmentsWithConfig and client.getTreatmentsWithConfigByFlagSets are not called unnecessarily when using SplitTreatments and useSplitTreatments.
 */
describe.each([
  ({ names, flagSets, attributes }: { names?: string[], flagSets?: string[], attributes?: SplitIO.Attributes }) => (
    // @ts-expect-error names and flagSets are mutually exclusive
    <SplitTreatments names={names} attributes={attributes} flagSets={flagSets} >
      {() => {
        renderTimes++;
        return null;
      }}
    </SplitTreatments>
  ),
  ({ names, flagSets, attributes }: { names?: string[], flagSets?: string[], attributes?: SplitIO.Attributes }) => {
    // @ts-expect-error names and flagSets are mutually exclusive
    useSplitTreatments({ names, flagSets, attributes });
    renderTimes++;
    return null;
  }
])('SplitTreatments & useSplitTreatments optimization', (InnerComponent) => {
  let outerFactory = SplitSdk(sdkBrowser);
  (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);

  function Component({ names, flagSets, attributes, splitKey, clientAttributes }: {
    names?: ISplitTreatmentsProps['names']
    flagSets?: ISplitTreatmentsProps['flagSets']
    attributes: ISplitTreatmentsProps['attributes']
    splitKey: ISplitClientProps['splitKey']
    clientAttributes?: ISplitClientProps['attributes']
  }) {
    return (
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey={splitKey} updateOnSdkUpdate={true} attributes={clientAttributes} >
          <InnerComponent names={names} attributes={attributes} flagSets={flagSets} />
        </SplitClient>
      </SplitFactory>
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

  it('rerenders but does not re-evaluate feature flags if client, lastUpdate, names, flagSets and attributes are the same object.', () => {
    wrapper.rerender(<Component names={names} flagSets={flagSets} attributes={attributes} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  it('rerenders but does not re-evaluate feature flags if client, lastUpdate, names, flagSets and attributes are equals (shallow comparison).', () => {
    wrapper.rerender(<Component names={[...names]} flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  it('rerenders and re-evaluates feature flags if names are not equals (shallow array comparison).', () => {
    wrapper.rerender(<Component names={[...names, 'split3']} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(0);
  });

  it('rerenders and re-evaluates feature flags if flag sets are not equals (shallow array comparison).', () => {
    wrapper.rerender(<Component flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);
    wrapper.rerender(<Component flagSets={[...flagSets]} attributes={{ ...attributes }} splitKey={splitKey} />);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(1);

    wrapper.rerender(<Component flagSets={[...flagSets, 'split3']} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(4);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client().getTreatmentsWithConfigByFlagSets).toBeCalledTimes(2);
  });

  it('rerenders and re-evaluates feature flags if attributes are not equals (shallow object comparison).', () => {
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

  it('rerenders and re-evaluates feature flags if lastUpdate timestamp changes (e.g., SDK_UPDATE event).', () => {
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

  it('rerenders and re-evaluates feature flags if client changes.', async () => {
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'otherKey'} />);
    await act(() => (outerFactory as any).client('otherKey').__emitter__.emit(Event.SDK_READY));

    // Initial render + 2 renders (in 3 updates) -> automatic batching https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client('otherKey').getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders and re-evaluate feature flags when Split context changes (in both SplitFactory and SplitClient components).', async () => {
    // changes in SplitContext implies that either the factory, the client (user key), or its status changed, what might imply a change in treatments
    const outerFactory = SplitSdk(sdkBrowser);
    let renderTimesComp1 = 0;
    let renderTimesComp2 = 0;

    // test context updates on SplitFactory
    render(
      <SplitFactory factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        <SplitTreatments names={names} attributes={attributes} >
          {() => {
            renderTimesComp1++;
            return null;
          }}
        </SplitTreatments>
      </SplitFactory>
    );

    // test context updates on SplitClient
    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' updateOnSdkReadyFromCache={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
          <SplitTreatments names={names} attributes={attributes} >
            {() => {
              renderTimesComp2++;
              return null;
            }}
          </SplitTreatments>
        </SplitClient>
      </SplitFactory>
    );

    expect(renderTimesComp1).toBe(1);
    expect(renderTimesComp2).toBe(1);

    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_FROM_CACHE);
    });

    expect(renderTimesComp1).toBe(2);
    expect(renderTimesComp2).toBe(2); // updateOnSdkReadyFromCache === false, in second component

    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
    });

    expect(renderTimesComp1).toBe(3);
    expect(renderTimesComp2).toBe(3);

    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
    });

    expect(renderTimesComp1).toBe(3); // updateOnSdkReady === false, in first component
    expect(renderTimesComp2).toBe(4);

    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
    });

    expect(renderTimesComp1).toBe(4);
    expect(renderTimesComp2).toBe(5);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(3); // renderTimes - 1, for the 1st render where SDK is not operational
    expect(outerFactory.client('user2').getTreatmentsWithConfig).toBeCalledTimes(4); // idem
  });

  it('rerenders and re-evaluates feature flags if client attributes changes.', (done) => {
    const originalFactory = outerFactory;
    outerFactory = newSplitFactoryLocalhostInstance();

    const client = outerFactory.client('emma2');
    const clientSpy = {
      getTreatmentsWithConfig: jest.spyOn(client, 'getTreatmentsWithConfig')
    }

    client.on(client.Event.SDK_READY, () => {
      wrapper = render(<Component names={names} attributes={attributes} splitKey={'emma2'} />);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(1);
      wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'emma2'} clientAttributes={{ att2: 'att1_val1' }} />);
      expect(renderTimes).toBe(3);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(2);

      wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'emma2'} clientAttributes={{ att2: 'att1_val2' }} />);
      expect(renderTimes).toBe(4);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3);

      wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'emma2'} clientAttributes={{ att2: 'att1_val2' }} />);
      expect(renderTimes).toBe(5);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3); // not called again. clientAttributes object is shallow equal

      outerFactory = originalFactory;
      client.destroy().then(done)
    })
  });

});
