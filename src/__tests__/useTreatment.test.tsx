import React from 'react';
import { mount } from 'enzyme';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';
jest.mock('../constants', () => {
  const actual = jest.requireActual('../constants');
  return {
    ...actual,
    getControlTreatmentsWithConfig: jest.fn(actual.getControlTreatmentsWithConfig),
  };
});
import { getControlTreatmentsWithConfig } from '../constants';
const logSpy = jest.spyOn(console, 'log');

/** Test target */
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import useTreatment from '../useTreatment';

describe('useTreatment', () => {

  const splitName = 'split1';
  const attributes = { att1: 'att1' };

  test('returns the Treatment from the client at Split context updated by SplitFactory.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatment;

    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatment = useTreatment(splitName, attributes);
          return null;
        })}</SplitFactory>,
    );
    const getTreatmentWithConfig: jest.Mock = (outerFactory.client() as any).getTreatmentWithConfig;
    expect(getTreatmentWithConfig).toBeCalledWith(splitName, attributes);
    expect(getTreatmentWithConfig).toHaveReturnedWith(treatment);
  });

  test('returns the Treatment from the client at Split context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatment;

    mount(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >{
          React.createElement(() => {
            treatment = useTreatment(splitName, attributes);
            return null;
          })}
        </SplitClient>
      </SplitFactory>,
    );
    const getTreatmentWithConfig: jest.Mock = (outerFactory.client('user2') as any).getTreatmentWithConfig;
    expect(getTreatmentWithConfig).toBeCalledWith(splitName, attributes);
    expect(getTreatmentWithConfig).toHaveReturnedWith(treatment);
  });

  test('returns the Treatment from a new client given a splitKey.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatment;

    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatment = useTreatment(splitName, attributes, 'user2');
          return null;
        })}
      </SplitFactory>,
    );
    const getTreatmentWithConfig: jest.Mock = (outerFactory.client('user2') as any).getTreatmentWithConfig;
    expect(getTreatmentWithConfig).toBeCalledWith(splitName, attributes);
    expect(getTreatmentWithConfig).toHaveReturnedWith(treatment);
  });

  test('returns Control Treatment if invoked outside Split context.', () => {
    let treatment;

    mount(
      React.createElement(
        () => {
          treatment = useTreatment(splitName, attributes);
          return null;
        }),
    );
    expect(getControlTreatmentsWithConfig).toBeCalledWith([splitName]);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith({
      split1: {
        config: null, 
        treatment: 'control'
      }
    });
  });

  /**
   * Input validation. Passing invalid split names or attributes while the Sdk
   * is not ready doesn't emit errors, and logs meaningful messages instead.
   */
  test('Input validation: invalid "name" and "attributes" params in useTreatment.', (done) => {
    mount(
      React.createElement(
        () => {
          // @ts-ignore
          let treatment = useTreatment('split1');
          expect(treatment).toEqual({});
          // @ts-ignore
          treatment = useTreatment([true]);
          expect(treatment).toEqual({});
          return null;
        }),
    );
    expect(logSpy).toBeCalledWith('[ERROR] split names must be a non-empty array.');
    expect(logSpy).toBeCalledWith('[ERROR] you passed an invalid split name, split name must be a non-empty string.');

    done();
  });

});
