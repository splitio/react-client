import React from 'react';
import { mount, shallow } from 'enzyme';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import SplitFactory from '../SplitFactory';
import SplitClient from '../SplitClient';
import useClient from '../useClient';
import { testAttributesBinding, TestComponentProps } from './testUtils/utils';

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

  test('attributes binding test with utility', (done) => {

    function Component({ attributesFactory, attributesClient, splitKey, testSwitch, factory }: TestComponentProps) {
      return (
        <SplitFactory factory={factory} attributes={attributesFactory} >{
          React.createElement(() => {
            useClient(splitKey, 'user', attributesClient);
            testSwitch(done, splitKey);
            return null;
          })
        }</SplitFactory>
      );
    }

    testAttributesBinding(Component);

  });

});
