import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import { ISplitTreatmentsChildProps, ISplitTreatmentsProps, ISplitClientProps } from '../types';
import SplitTreatments from '../SplitTreatments';
import SplitClient from '../SplitClient';
import SplitFactory from '../SplitFactory';
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
    const splitNames = ['split1', 'split2'];
    mount(
      <SplitFactory config={sdkBrowser} >{
        ({ factory }) => {
          return (
            <SplitClient splitKey='user1' >
              <SplitTreatments names={splitNames} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client('user1');
                  expect(clientMock.getTreatmentsWithConfig.mock.calls.length).toBe(0);
                  expect(treatments).toEqual(getControlTreatmentsWithConfig(splitNames));
                  done();
                  return null;
                }}
              </SplitTreatments>
            </SplitClient>);
        }
      }
      </SplitFactory>);
  });

  it('passes as treatments prop the value returned by the method "client.getTreatmentsWithConfig" if the SDK is ready.', (done) => {
    const splitNames = ['split1', 'split2'];
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    setTimeout(() => {
      mount(
        <SplitFactory factory={outerFactory} >{
          ({ factory, isReady }) => {
            expect(getStatus(outerFactory.client()).isReady).toBe(isReady);
            expect(isReady).toBe(true);
            return (
              <SplitTreatments names={splitNames} >
                {({ treatments, isReady: isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitTreatmentsChildProps) => {
                  const clientMock: any = factory?.client();
                  expect(clientMock.getTreatmentsWithConfig.mock.calls.length).toBe(1);
                  expect(treatments).toBe(clientMock.getTreatmentsWithConfig.mock.results[0].value);
                  expect(splitNames).toBe(clientMock.getTreatmentsWithConfig.mock.calls[0][0]);
                  expect([isReady2, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([true, false, false, false, false, 0]);
                  done();
                  return null;
                }}
              </SplitTreatments>);
          }
        }
        </SplitFactory>);
    }, 0);
  });

  it('logs error and passes control treatments ("getControlTreatmentsWithConfig") if rendered outside an SplitProvider component.', () => {
    const splitNames = ['split1', 'split2'];
    let passedTreatments;
    mount(
      <SplitTreatments names={splitNames} >
        {({ treatments }: ISplitTreatmentsChildProps) => {
          passedTreatments = treatments;
          return null;
        }}
      </SplitTreatments>);
    expect(logSpy).toBeCalledWith(WARN_ST_NO_CLIENT);
    expect(getControlTreatmentsWithConfig).toBeCalledWith(splitNames);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith(passedTreatments);
  });

  /**
   * Input validation. Passing invalid split names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  it('Input validation: invalid "names" and "attributes" props in SplitTreatments.', (done) => {
    const splitNames = ['split1', 'split2'];

    mount(
      <SplitFactory config={sdkBrowser} >{
        ({ factory }) => {
          return (
            <>
              {/* @ts-ignore */}
              <SplitTreatments split_names={splitNames} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
              {/* @ts-ignore */}
              <SplitTreatments names={splitNames[0]} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
              {/* @ts-ignore */}
              <SplitTreatments names={[true]} attributes={'invalid'} >
                {({ treatments }: ISplitTreatmentsChildProps) => {
                  expect(treatments).toEqual({});
                  return null;
                }}
              </SplitTreatments>
            </>
          );
        }
      }
      </SplitFactory>);
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

  let wrapper: ReactWrapper;

  beforeEach(() => {
    renderTimes = 0;
    (outerFactory.client().getTreatmentsWithConfig as jest.Mock).mockClear();
    wrapper = mount(<Component names={names} attributes={attributes} splitKey={splitKey} />);
  })

  afterEach(() => {
    wrapper.unmount(); // unmount to remove event listener from factory
  })

  it('rerenders but does not re-evaluate splits if client, lastUpdate, names and attributes are the same object.', () => {
    wrapper.setProps({ names, attributes, splitKey });

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders but does not re-evaluate splits if client, lastUpdate, names and attributes are equals (shallow comparison).', () => {
    wrapper.setProps({ names: [...names], attributes: { ...attributes }, splitKey });

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders and re-evaluates splits if names are not equals (shallow array comparison).', () => {
    wrapper.setProps({ names: [...names, 'split3'], attributes: { ...attributes }, splitKey });

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
  });

  it('rerenders and re-evaluates splits if attributes are not equals (shallow object comparison).', () => {
    const attributesRef = { ...attributes, att2: 'att2' };
    wrapper.setProps({ names: [...names], attributes: attributesRef, splitKey });

    expect(renderTimes).toBe(2);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);

    // If passing same reference but mutated (bad practice), the component re-renders but doesn't re-evaluate splits
    attributesRef.att2 = 'att2_val2';
    wrapper.setProps({ names: [...names], attributes: attributesRef, splitKey });
    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);
  });

  it('rerenders and re-evaluates splits if lastUpdate timestamp changes (e.g., SDK_UPDATE event).', () => {
    // re-renders and re-evaluates
    (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);

    // re-rendering after destroy, doesn't re-evaluate even if names and attributes are different because the sdk is not operational
    (outerFactory as any).client().destroy();
    wrapper.setProps({ names, attributes, splitKey }); // manually update the component, because there isn't an event listener for destroy

    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(2);

    // Restore the client to be READY
    (outerFactory as any).client().__restore();
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
  });

  it('rerenders and re-evaluates splits if client changes.', () => {
    wrapper.setProps({ names, attributes, splitKey: 'otherKey' });
    (outerFactory as any).client('otherKey').__emitter__.emit(Event.SDK_READY);

    expect(renderTimes).toBe(3);
    expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(1);
    expect(outerFactory.client('otherKey').getTreatmentsWithConfig).toBeCalledTimes(1);
  });

  it('rerenders and re-evaluate splits when Split context changes (in both SplitFactory and SplitClient components).', (done) => {
    // changes in SplitContext implies that either the factory, the client (user key), or its status changed, what might imply a change in treatments
    const outerFactory = SplitSdk(sdkBrowser);
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimesComp1 = 0;
    let renderTimesComp2 = 0;

    // test context updates on SplitFactory
    mount(
      <SplitFactory factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        <SplitTreatments names={names} attributes={attributes} >
          {() => {
            renderTimesComp1++;
            return null;
          }}
        </SplitTreatments>
      </SplitFactory>);

    // test context updates on SplitClient
    mount(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' updateOnSdkReadyFromCache={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
          <SplitTreatments names={names} attributes={attributes} >
            {() => {
              renderTimesComp2++;
              return null;
            }}
          </SplitTreatments>
        </SplitClient>
      </SplitFactory>);

    setTimeout(() => {
      expect(renderTimesComp1).toBe(1);
      expect(renderTimesComp2).toBe(1);
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_FROM_CACHE);
      setTimeout(() => {
        expect(renderTimesComp1).toBe(2);
        expect(renderTimesComp2).toBe(1); // updateOnSdkReadyFromCache === false, in second component
        (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        setTimeout(() => {
          expect(renderTimesComp1).toBe(3);
          expect(renderTimesComp2).toBe(2);
          (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
          (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
          setTimeout(() => {
            expect(renderTimesComp1).toBe(3); // updateOnSdkReady === false, in first component
            expect(renderTimesComp2).toBe(3);
            (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
            setTimeout(() => {
              expect(renderTimesComp1).toBe(4);
              expect(renderTimesComp2).toBe(4);
              expect(outerFactory.client().getTreatmentsWithConfig).toBeCalledTimes(3); // renderTimes - 1, for the 1st render where SDK is not operational
              expect(outerFactory.client('user2').getTreatmentsWithConfig).toBeCalledTimes(3); // idem
              done();
            });
          });
        });
      });
    });

  });

  it('rerenders and re-evaluates splits if client attributes changes.', (done) => {
    const originalFactory = outerFactory;
    outerFactory = newSplitFactoryLocalhostInstance();

    const client = outerFactory.client('emma2');
    const clientSpy = {
      getTreatmentsWithConfig: jest.spyOn(client, 'getTreatmentsWithConfig')
    }

    client.on(client.Event.SDK_READY, () => {
      wrapper = mount(<Component names={names} attributes={attributes} splitKey={'emma2'} />);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(1);

      wrapper.setProps({ names, attributes, clientAttributes: { att2: 'att1_val1' } });
      expect(renderTimes).toBe(3);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(2);

      wrapper.setProps({ names, attributes, clientAttributes: { att2: 'att1_val2' } });
      expect(renderTimes).toBe(4);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3);

      wrapper.setProps({ names, attributes, clientAttributes: { att2: 'att1_val2' } });
      expect(renderTimes).toBe(5);
      expect(clientSpy.getTreatmentsWithConfig).toBeCalledTimes(3); // not called again. clientAttributes object is shallow equal

      outerFactory = originalFactory;
      client.destroy().then(done)
    })
  });

});
