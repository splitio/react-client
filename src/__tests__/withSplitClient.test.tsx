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
import withSplitFactory from '../withSplitFactory';
import withSplitClient from '../withSplitClient';
import SplitClient from '../SplitClient';
import SplitFactory from '../SplitFactory';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    const Component = withSplitFactory(sdkBrowser)<{}>(
      withSplitClient('user1')(
        ({ client, isReady, isTimedout, lastUpdate }) => {
          expect(client).not.toBe(null);
          expect(isReady).toBe(false);
          expect(isTimedout).toBe(false);
          expect(lastUpdate).toBe(0);
          return null;
        }));
    mount(<Component />);
  });

  test('passes ready props to the child if client is ready.', (done) => {
    const outerFactory = SplitSdk(sdkBrowser);
    (outerFactory as any).client().__emitter__.emit(Event.SDK_READY);
    ((outerFactory.manager() as any).names as jest.Mock).mockReturnValue(['split1']);
    outerFactory.client().ready().then(() => {
      const Component = withSplitFactory(undefined, outerFactory)<{}>(
        withSplitClient('user1')(
          ({ client, isReady, isTimedout, lastUpdate }) => {
            expect(client).toBe(outerFactory.client('user1'));
            expect(isReady).toBe(false);
            expect(isTimedout).toBe(false);
            expect(lastUpdate).toBe(0);
            return null;
          }));
      mount(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
        ({ outerProp1, outerProp2, client, isReady, isTimedout, lastUpdate }) => {
          expect(outerProp1).toBe('outerProp1');
          expect(outerProp2).toBe(2);
          expect(client).not.toBe(null);
          expect(isReady).toBe(false);
          expect(isTimedout).toBe(false);
          expect(lastUpdate).toBe(0);
          return null;
        }));
    mount(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitClient.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const Component = withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
      () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady);
    const wrapper = shallow(<Component outerProp1='outerProp1' outerProp2={2} />);
    expect(wrapper.type()).toBe(SplitClient);
    expect(wrapper.prop('updateOnSdkUpdate')).toBe(updateOnSdkUpdate);
    expect(wrapper.prop('updateOnSdkTimedout')).toBe(updateOnSdkTimedout);
    expect(wrapper.prop('updateOnSdkReady')).toBe(updateOnSdkReady);
  });

});
