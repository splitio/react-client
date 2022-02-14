import React from 'react';
import { mount, shallow } from 'enzyme'; // @ts-ignore. No declaration file
import { SplitFactory as originalSplitFactory } from '../../lib/splitio/index';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import withSplitFactory from '../withSplitFactory';
import withSplitClient from '../withSplitClient';
import SplitClient from '../SplitClient';

describe('SplitClient', () => {

  test('passes no-ready props to the child if client is not ready.', () => {
    const Component = withSplitFactory(sdkBrowser)<{}>(
      withSplitClient('user1')(
        ({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
          expect(client).not.toBe(null);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
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
          ({ client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
            expect(client).toBe(outerFactory.client('user1'));
            expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
            return null;
          }));
      mount(<Component />);
      done();
    });
  });

  test('passes Split props and outer props to the child.', () => {
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
        ({ outerProp1, outerProp2, client, isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate }) => {
          expect(outerProp1).toBe('outerProp1');
          expect(outerProp2).toBe(2);
          expect(client).not.toBe(null);
          expect([isReady, isReadyFromCache, hasTimedout, isTimedout, isDestroyed, lastUpdate]).toStrictEqual([false, false, false, false, false, 0]);
          return null;
        }));
    mount(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

  test('passes Status props to SplitClient.', () => {
    const updateOnSdkUpdate = true;
    const updateOnSdkTimedout = false;
    const updateOnSdkReady = true;
    const updateOnSdkReadyFromCache = false;
    const Component = withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
      () => null, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache);
    const wrapper = shallow(<Component outerProp1='outerProp1' outerProp2={2} />);
    expect(wrapper.type()).toBe(SplitClient);
    expect(wrapper.prop('updateOnSdkUpdate')).toBe(updateOnSdkUpdate);
    expect(wrapper.prop('updateOnSdkTimedout')).toBe(updateOnSdkTimedout);
    expect(wrapper.prop('updateOnSdkReady')).toBe(updateOnSdkReady);
    expect(wrapper.prop('updateOnSdkReadyFromCache')).toBe(updateOnSdkReadyFromCache);
  });

  test('passes attributes to Splitclient', () => {

    let renderTimes = 0;

    const attributesFactory = { at1: 'at1' };
    const attributesClient = { at2: 'at2' };

    const factory = originalSplitFactory({
      core: {
        authorizationKey: 'localhost',
        key: 'emma'
      },
      features: {
        test_split: 'on'
      }
    })

    const mainClient = factory?.client();
    const mainClientSpy = {
      setAttributes: jest.spyOn(mainClient, 'setAttributes'),
      clearAttributes: jest.spyOn(mainClient, 'clearAttributes')
    }

    const client = factory?.client('user1', 'user');
    const clientSpy = {
      setAttributes: jest.spyOn(client, 'setAttributes'),
      clearAttributes: jest.spyOn(client, 'clearAttributes'),
    }

    function Component({ attributesFactory, attributesClient }: { attributesFactory: any, attributesClient: any }) {
      const Component = withSplitFactory(undefined, factory, attributesFactory)(
      withSplitClient('user1', 'user', attributesClient)(
        () => {
          renderTimes++;
          switch (renderTimes) {
            case 1:
              expect(mainClientSpy.setAttributes).lastCalledWith(attributesFactory);
              expect(clientSpy.setAttributes).lastCalledWith(attributesClient);
              expect(mainClient?.getAttributes()).toStrictEqual(attributesFactory);
              expect(client?.getAttributes()).toStrictEqual(attributesClient);
              break;
            case 2:
              expect(mainClientSpy.clearAttributes).toBeCalledTimes(1);
              expect(clientSpy.setAttributes).lastCalledWith(attributesClient);
              expect(mainClient?.getAttributes()).toStrictEqual({});
              expect(client?.getAttributes()).toStrictEqual({at2: 'at2', at3:'at3'});
              break;
            case 3:
              expect(mainClientSpy.setAttributes).lastCalledWith({at4: 'at4'});
              expect(clientSpy.clearAttributes).toBeCalledTimes(1);
              expect(mainClient?.getAttributes()).toStrictEqual({at4: 'at4'});
              expect(client?.getAttributes()).toStrictEqual({});
              break;
            case 4:
              expect(mainClientSpy.clearAttributes).toBeCalledTimes(2);
              expect(clientSpy.clearAttributes).toBeCalledTimes(2);
              expect(mainClient?.getAttributes()).toStrictEqual({});
              expect(client?.getAttributes()).toStrictEqual({});

            }
          return null;
        }))
        return Component}

    // @ts-ignore
    const wrapper = mount(<Component />);

    wrapper.setProps({ attributesFactory: undefined, attributesClient: {at3: 'at3'} });
    wrapper.setProps({ attributesFactory: {at4: 'at4'}, attributesClient: undefined });
    wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });
  });

});
