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

/** Test target */
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import useTreatments from '../useTreatments';

describe('useTreatments', () => {

  const splitNames = [ 'split1' ];
  const attributes = { att1: 'att1' };

  test('returns the Treatments from the client at Split context updated by SplitFactory.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatments;

    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatments = useTreatments(splitNames, attributes);
          return null;
        })}</SplitFactory>,
    );
    const getTreatmentsWithConfig: jest.Mock = (outerFactory.client() as any).getTreatmentsWithConfig;
    expect(getTreatmentsWithConfig).toBeCalledWith(splitNames, attributes);
    expect(getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from the client at Split context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatments;

    mount(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >{
          React.createElement(() => {
            treatments = useTreatments(splitNames, attributes);
            return null;
          })}
        </SplitClient>
      </SplitFactory>,
    );
    const getTreatmentsWithConfig: jest.Mock = (outerFactory.client('user2') as any).getTreatmentsWithConfig;
    expect(getTreatmentsWithConfig).toBeCalledWith(splitNames, attributes);
    expect(getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  test('returns the Treatments from a new client given a splitKey.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let treatments;

    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          treatments = useTreatments(splitNames, attributes, 'user2');
          return null;
        })}
      </SplitFactory>,
    );
    const getTreatmentsWithConfig: jest.Mock = (outerFactory.client('user2') as any).getTreatmentsWithConfig;
    expect(getTreatmentsWithConfig).toBeCalledWith(splitNames, attributes);
    expect(getTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

  // THE FOLLOWING TEST WILL PROBABLE BE CHANGED BY 'return a null value or throw an error if it is not inside an SplitProvider'
  test('returns Control Treatments if invoked outside Split context.', () => {
    let treatments;

    mount(
      React.createElement(
        () => {
          treatments = useTreatments(splitNames, attributes);
          return null;
        }),
    );
    expect(getControlTreatmentsWithConfig).toBeCalledWith(splitNames);
    expect(getControlTreatmentsWithConfig).toHaveReturnedWith(treatments);
  });

});
