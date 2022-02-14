import React from 'react';
import { mount, shallow } from 'enzyme';

// @ts-ignore
import { SplitFactory as originalSplitFactory } from '../../lib/splitio/index';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import useClient from '../useClient';

describe('useClient', () => {

  test('returns the main client from the context updated by SplitFactory.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          client = useClient();
          return null;
        })}</SplitFactory>,
    );
    expect(client).toBe(outerFactory.client());
  });

  test('returns the client from the context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    mount(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >{
          React.createElement(() => {
            client = useClient();
            return null;
          })}
        </SplitClient>
      </SplitFactory>,
    );
    expect(client).toBe(outerFactory.client('user2'));
  });

  test('returns a new client from the factory at Split context given a splitKey.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let client;
    mount(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          (outerFactory.client as jest.Mock).mockClear();
          client = useClient('user2', 'user');
          return null;
        })}
      </SplitFactory>,
    );
    expect(outerFactory.client as jest.Mock).toBeCalledWith('user2', 'user');
    expect(outerFactory.client as jest.Mock).toHaveReturnedWith(client);
  });

  test('returns null if invoked outside Split context.', () => {
    let client;
    let sharedClient;
    shallow(
      React.createElement(
        () => {
          client = useClient();
          sharedClient = useClient('user2', 'user');
          return null;
        }),
    );
    expect(client).toBe(null);
    expect(sharedClient).toBe(null);
  });

  test('calls client setAttributes and clearAttributes.', (done) => {

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

    const mainClient = factory.client();
    const mainClientSpy = {
      setAttributes: jest.spyOn(mainClient, 'setAttributes'),
      clearAttributes: jest.spyOn(mainClient, 'clearAttributes')
    }

    const client = factory.client('user1', 'user');
    const clientSpy = {
      setAttributes: jest.spyOn(client, 'setAttributes'),
      clearAttributes: jest.spyOn(client, 'clearAttributes'),
    }

    function Component({ attributesFactory, attributesClient }: { attributesFactory: any, attributesClient: any }) {
      return (
        <SplitFactory factory={factory} attributes={attributesFactory} >{
          React.createElement(() => {
            useClient('user1', 'user', attributesClient);
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
                done()
              }
            return null
        })}</SplitFactory>
      )
    }

    const wrapper = mount(<Component attributesFactory={attributesFactory} attributesClient={attributesClient} />);

    wrapper.setProps({ attributesFactory: undefined, attributesClient: {at3: 'at3'} });
    wrapper.setProps({ attributesFactory: {at4: 'at4'}, attributesClient: undefined });
    wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });
  });

});
