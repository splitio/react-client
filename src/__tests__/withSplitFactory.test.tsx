import React from 'react';
import { mount, shallow } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './utils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './utils/sdkConfigs';

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import withSplitFactory from '../withSplitFactory';
import SplitFactory from '../SplitFactory';
import { getClientWithStatus } from '../utils';

describe('SplitFactory', () => {

  test('passes no-ready props to the child if initialized with a no ready factory (e.g., using config object).', () => {
    const Component = withSplitFactory(sdkBrowser)(
      ({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
        expect(factory).toBeInstanceOf(Object);
        expect(isReady).toBe(false);
        expect(isTimedout).toBe(false);
        expect(lastUpdate).toBe(0);
        return null;
      });
    mount(<Component />);
  });

  test('passes ready props to the child if initialized with a ready factory.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    getClientWithStatus(outerFactory);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      const Component = withSplitFactory(undefined, outerFactory)(
        ({ factory, isReady, isTimedout, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBe(outerFactory);
          expect(isReady).toBe(true);
          expect(isTimedout).toBe(false);
          expect(lastUpdate).toBe(0);
          return null;
        });
      mount(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      ({ outerProp1, outerProp2, factory, isReady, isTimedout, lastUpdate }) => {
        expect(outerProp1).toBe('outerProp1');
        expect(outerProp2).toBe(2);
        expect(factory).toBeInstanceOf(Object);
        expect(isReady).toBe(false);
        expect(isTimedout).toBe(false);
        expect(lastUpdate).toBe(0);
        return null;
      });
    mount(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitFactory.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady);
    const wrapper = shallow(<Component outerProp1='outerProp1' outerProp2={2} />);
    expect(wrapper.type()).toBe(SplitFactory);
    expect(wrapper.prop('updateOnSdkUpdate')).toBe(updateOnSdkUpdate);
    expect(wrapper.prop('updateOnSdkTimedout')).toBe(updateOnSdkTimedout);
    expect(wrapper.prop('updateOnSdkReady')).toBe(updateOnSdkReady);
  });

});
