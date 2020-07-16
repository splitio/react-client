import React from 'react';
import { mount, shallow } from 'enzyme';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { ISplitFactoryChildProps } from '../types';
import withSplitFactory from '../withSplitFactory';
import SplitFactory from '../SplitFactory';

describe('SplitFactory', () => {

  test('passes no-ready props to the child if initialized with a no ready factory (e.g., using config object).', () => {
    const Component = withSplitFactory(sdkBrowser)(
      ({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
        expect(factory).toBeInstanceOf(Object);
        expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
        return null;
      });
    mount(<Component />);
  });

  test('passes ready props to the child if initialized with a ready factory.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      const Component = withSplitFactory(undefined, outerFactory)(
        ({ factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }: ISplitFactoryChildProps) => {
          expect(factory).toBe(outerFactory);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([true, false, false, false, false, 0]);
          return null;
        });
      mount(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      ({ outerProp1, outerProp2, factory, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
        expect(outerProp1).toBe('outerProp1');
        expect(outerProp2).toBe(2);
        expect(factory).toBeInstanceOf(Object);
        expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
        return null;
      });
    mount(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitFactory.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const updateOnSdkReadyFromCache = false;
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache);
    const wrapper = shallow(<Component outerProp1='outerProp1' outerProp2={2} />);
    expect(wrapper.type()).toBe(SplitFactory);
    expect(wrapper.prop('updateOnSdkUpdate')).toBe(updateOnSdkUpdate);
    expect(wrapper.prop('updateOnSdkTimedout')).toBe(updateOnSdkTimedout);
    expect(wrapper.prop('updateOnSdkReady')).toBe(updateOnSdkReady);
    expect(wrapper.prop('updateOnSdkReadyFromCache')).toBe(updateOnSdkReadyFromCache);
  });

});
