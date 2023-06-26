import React from 'react';
import { render, RenderResult, act } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { ISplitTreatmentsChildProps, ISplitTreatmentsProps, ISplitClientProps } from '../types';
import { SplitTreatments } from '../SplitTreatments';
import { SplitClient } from '../SplitClient';
import { SplitFactory } from '../SplitFactory';
jest.mock('../constants', () => {
  const actual = jest.requireActual('../constants');
  return {
    ...actual,
    getControlTreatmentsWithConfig: jest.fn(actual.getControlTreatmentsWithConfig),
  };
});
import { getControlTreatmentsWithConfig, WARN_ST_NO_CLIENT } from '../constants';
import { getStatus } from '../utils';
import { newSplitFactoryLocalhostInstance } from './testUtils/utils';

describe('SplitTreatments', () => {

  afterEach(() => { logSpy.mockClear() });

  it('passes as treatments prop the value returned by the function "getControlTreatmentsWithConfig" if the SDK is not ready.', (done) => {
    const featureFlagNames = ['split1', 'split2'];
    render(
      <SplitFactory config={sdkBrowser} >
        {({ factory }) => {
          return (
            <SplitClient splitKey='user1' >
              <SplitTreatments names={featureFlagNames} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client('user1');
                  expect(clientMock.getTreatmentsWithConfig.mock.calls.length).toBe(0);
                  expect(treatments).toEqual(getControlTreatmentsWithConfig(featureFlagNames));
                  done();
                  return null;
                }}
              </SplitTreatments>
            </SplitClient>
          );
        }}
      </SplitFactory>
    );
  });

  it('passes as treatments prop the value returned by the method "client.getTreatmentsWithConfig" if the SDK is ready.', (done) => {
    const featureFlagNames = ['split1', 'split2'];
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);

    render(
      <SplitFactory factory={outerFactory} >
        {({ factory, isReady }) => {
          expect(getStatus(outerFactory.client()).isReady).toBe(isReady);
          expect(isReady).toBe(true);
          return (
            <SplitTreatments names={featureFlagNames} >
              {({ treatments, isReady: isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitTreatmentsChildProps) => {
                const clientMock: any = factory?.client();
                expect(clientMock.getTreatmentsWithConfig.mock.calls.length).toBe(1);
                expect(treatments).toBe(clientMock.getTreatmentsWithConfig.mock.results[0].value);
                expect(featureFlagNames).toBe(clientMock.getTreatmentsWithConfig.mock.calls[0][0]);
                expect([isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([true, false, false, false, false, 0]);
                done();
                return null;
              }}
            </SplitTreatments>
          );
        }}
      </SplitFactory>
    );
  });

  it('logs error and passes control treatments ("getControlTreatmentsWithConfig") if rendered outside an SplitProvider component.', () => {
    const featureFlagNames = ['split1', 'split2'];
    let passedTreatments;
    render(
      <SplitTreatments names={featureFlagNames} >
        {({ treatments }: ISplitTreatmentsChildProps) => {
          passedTreatments = treatments;
          return null;
        }}
      </SplitTreatments>
    );
    expect(logSpy).toBeCalledWith(WARN_ST_NO_CLIENT);
    expect(getControlTreatmentsWithConfig).toBeCalledWith(featureFlagNames);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith(passedTreatments);
  });

  /**
   * Input validation. Passing invalid feature flag names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  it('Input validation: invalid "names" and "attributes" props in SplitTreatments.', (done) => {
    const featureFlagNames = ['split1', 'split2'];

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
    expect(logSpy).toBeCalledWith('[ERROR] split names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid split name, split name must be a non-empty string.');

    done();
  });

});

/**
 * Tests for asserting that client.getTreatmentsWithConfig is not called unnecessarely
 */
describe('SplitTreatments optimization', () => {

  let renderTimes = 0;

  let outerFactory = SplitSdk(sdkBrowser);
  (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);

  function Component({ names, attributes, splitKey, clientAttributes }: {
    names: ISplitTreatmentsProps['names']
    attributes: ISplitTreatmentsProps['attributes']
    splitKey: ISplitClientProps['splitKey']
    clientAttributes?: ISplitClientProps['attributes']
  }) {
    return (
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey={splitKey} updateOnSdkUpdate={true} attributes={clientAttributes} >
          <SplitTreatments names={names} attributes={attributes} >
            {() => {
              renderTimes++;
              return null;
            }}
          </SplitTreatments>
        </SplitClient>
      </SplitFactory>
    );
  }

  const names = ['split1', 'split2'];
  const attributes = { att1: 'att1' };
  const splitKey = sdkBrowser.core.key;

  let wrapper: RenderResult;

  beforeEach(() => {
    renderTimes = 0;
    (outerFactory.client().getTreatmentsWithConfig as jest.Mock).mockClear();
    wrapper = render(<Component names={names} attributes={attributes} splitKey={splitKey} />);
  })

  afterEach(() => {
    wrapper.unmount(); // unmount to remove event listener from factory
  })

  it('rerenders but does not re-evaluate feature flags if client, lastUpdate, names and attributes are the same object.', () => {
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders but does not re-evaluate feature flags if client, lastUpdate, names and attributes are equals (shallow comparison).', () => {
    wrapper.rerender(<Component names={[...names]} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders and re-evaluates feature flags if names are not equals (shallow array comparison).', () => {
    wrapper.rerender(<Component names={[...names, 'split3']} attributes={{ ...attributes }} splitKey={splitKey} />);

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
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

  it('rerenders and re-evaluates feature flags if lastUpdate timestamp changes (e.g., SDK_UPDATE event).', (done) => {
    expect(renderTimes).toBe(1);

    // State update and split evaluation
    act(() => (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE));

    // State update after destroy doesn't re-evaluate because the sdk is not operational
    (outerFactory as any).client().destroy();
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={splitKey} />);

    setTimeout(() => {
      // Updates were batched as a single render, due to automatic batching https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
      expect(renderTimes).toBe(3);
      expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);

      // Restore the client to be READY
      (outerFactory as any).client().__restore();
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
      done();
    })
  });

  it('rerenders and re-evaluates feature flags if client changes.', () => {
    wrapper.rerender(<Component names={names} attributes={attributes} splitKey={'otherKey'} />);
    act(() => (outerFactory as any).client('otherKey').__emitter__.emit(Event.SDK_READY));

    // Initial render + 2 renders (in 3 updates) -> automatic batching https://reactjs.org/blog/2022/03/29/react-v18.html#new-feature-automatic-batching
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client('otherKey').getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders and re-evaluate splfeature flagsits when Split context changes (in both SplitFactory and SplitClient components).', async () => {
    // changes in SplitContext implies that either the factory, the client (user key), or its status changed, what might imply a change in treatments
    const outerFactory = SplitSdk(sdkBrowser);
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
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

    // delay SDK events to guarantee a different lastUpdate timestamp for SplitTreatments to re-evaluate
    await new Promise(resolve => setTimeout(resolve, 10));
    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
    });

    expect(renderTimesComp1).toBe(3);
    expect(renderTimesComp2).toBe(3);

    await new Promise(resolve => setTimeout(resolve, 10));
    act(() => {
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
    });

    expect(renderTimesComp1).toBe(3); // updateOnSdkReady === false, in first component
    expect(renderTimesComp2).toBe(4);

    await new Promise(resolve => setTimeout(resolve, 10));
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
