import React from 'react';
import { shallow, mount } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './utils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './utils/sdkConfigs';

/** Test target */
import { ISplitTreatmentsChildProps } from '../types';
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
import { getIsReady } from '../utils';

describe('SplitTreatments', () => {

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
            expect(getIsReady(outerFactory.client())).toBe(isReady);
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
    const logSpy = jest.spyOn(console, 'log');
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
   * Tests for shouldComponentUpdate
   */

  it('does not rerender if names and attributes are the same object.', () => {
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimes = 0;
    const wrapper = mount(
      <SplitTreatments names={names} attributes={attributes} >
        {() => {
          renderTimes++;
          return null;
        }}
      </SplitTreatments>);
    wrapper.setProps({ names, attributes });
    expect(renderTimes).toBe(1);
  });

  it('does not rerender if names and attributes are equals (shallow comparison).', () => {
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimes = 0;
    const wrapper = mount(
      <SplitTreatments names={names} attributes={attributes} >
        {() => {
          renderTimes++;
          return null;
        }}
      </SplitTreatments>);
    wrapper.setProps({ names: [...names], attributes: { ...attributes } });
    expect(renderTimes).toBe(1);
  });

  it('rerenders if names are not equals (shallow array comparison).', () => {
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimes = 0;
    const wrapper = mount(
      <SplitTreatments names={names} attributes={attributes} >
        {() => {
          renderTimes++;
          return null;
        }}
      </SplitTreatments>);
    wrapper.setProps({ names: [...names, 'split3'], attributes: { ...attributes } });
    expect(renderTimes).toBe(2);
  });

  it('rerenders if attributes are not equals (shallow object comparison).', () => {
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimes = 0;
    const wrapper = mount(
      <SplitTreatments names={names} attributes={attributes} >
        {() => {
          renderTimes++;
          return null;
        }}
      </SplitTreatments>);
    wrapper.setProps({ names: [...names], attributes: { ...attributes, att2: 'att2' } });
    expect(renderTimes).toBe(2);
  });

  test('rerenders when Split context changes (in both SplitFactory and SplitClient components).', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    const names = ['split1', 'split2'];
    const attributes = { att1: 'att1' };
    let renderTimes = 0;
    let renderTimesComp2 = 0;

    // test context updates on SplitFactory
    mount(
      <SplitFactory factory={outerFactory} updateOnSdkReady={false} updateOnSdkTimedout={true} updateOnSdkUpdate={true} >
        <SplitTreatments names={names} attributes={attributes} >
          {() => {
            renderTimes++;
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
      expect(renderTimes).toBe(1);
      expect(renderTimesComp2).toBe(1);
      (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_FROM_CACHE);
      (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_FROM_CACHE);
      setTimeout(() => {
        expect(renderTimes).toBe(2);
        expect(renderTimesComp2).toBe(1); // updateOnSdkReadyFromCache === false, in second component
        (outerFactory as any).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY_TIMED_OUT);
        setTimeout(() => {
          expect(renderTimes).toBe(3);
          expect(renderTimesComp2).toBe(2);
          (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
          (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_READY);
          setTimeout(() => {
            expect(renderTimes).toBe(3); // updateOnSdkReady === false, in first component
            expect(renderTimesComp2).toBe(3);
            (outerFactory as any).client().__emitter__.emit(Event.SDK_UPDATE);
            (outerFactory as any).client('user2').__emitter__.emit(Event.SDK_UPDATE);
            setTimeout(() => {
              expect(renderTimes).toBe(4);
              expect(renderTimesComp2).toBe(4);
              done();
            });
          });
        });
      });
    });

  });

});
