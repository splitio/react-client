import React from 'react';
import { mount } from 'enzyme';
import { SplitFactory as originalSplitFactory } from '@splitsoftware/splitio';

export interface TestComponentProps {
  attributesFactory: SplitIO.Attributes,
  attributesClient: SplitIO.Attributes,
  splitKey: SplitIO.SplitKey,
  testSwitch: (done: jest.DoneCallback, splitKey?: SplitIO.SplitKey) => void,
  factory: SplitIO.IBrowserSDK
};

export function newSplitFactoryLocalhostInstance() {
  return originalSplitFactory({
    core: {
      authorizationKey: 'localhost',
      key: 'emma'
    },
    features: {
      test_split: 'on'
    }
  })
}

export function testAttributesBinding(Component: React.FunctionComponent<TestComponentProps> | React.ComponentClass<TestComponentProps>) {

  let renderTimes = 0
  const factory = newSplitFactoryLocalhostInstance()

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

  // this function is called inside the received component
  function attributesBindingSwitch(done: any, splitKey?: SplitIO.SplitKey) {
    renderTimes++;
    switch (renderTimes) {
      case 1:
        if (splitKey) {
          expect(mainClientSpy.setAttributes).lastCalledWith({ at1: 'at1' });
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1' });
          expect(clientSpy.setAttributes).lastCalledWith({ at2: 'at2' });
          expect(client.getAttributes()).toStrictEqual({ at2: 'at2' });
        } else {
          expect(mainClientSpy.setAttributes.mock.calls).toEqual([[{ at1: 'at1' }], [{ at2: 'at2' }]]);
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at2: 'at2' });
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 2:
        if (splitKey) {
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1' });
          expect(clientSpy.setAttributes).lastCalledWith({ at3: 'at3' });
          expect(client.getAttributes()).toStrictEqual({ at2: 'at2', at3: 'at3' });
        } else {
          expect(mainClientSpy.setAttributes).lastCalledWith({ at3: 'at3' });
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at2: 'at2', at3: 'at3' });
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 3:
        if (splitKey) {
          expect(mainClientSpy.setAttributes).lastCalledWith({ at4: 'at4' });
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at4: 'at4' });
          expect(client.getAttributes()).toStrictEqual({ at2: 'at2', at3: 'at3' });
        } else {
          expect(mainClientSpy.setAttributes).lastCalledWith({ at4: 'at4' });
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at2: 'at2', at3: 'at3', at4: 'at4' });
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 4:
        if (splitKey) {
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at4: 'at4' });
          expect(client.getAttributes()).toStrictEqual({ at2: 'at2', at3: 'at3' });
        } else {
          expect(mainClient.getAttributes()).toStrictEqual({ at1: 'at1', at2: 'at2', at3: 'at3', at4: 'at4' });
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
          mainClient.destroy().then(done);
        }
        break;
    }
  }

  let wrapper = mount(<Component splitKey='user1' attributesFactory={{ at1: 'at1' }} attributesClient={{ at2: 'at2' }} testSwitch={attributesBindingSwitch} factory={factory} />);

  wrapper.setProps({ attributesFactory: undefined, attributesClient: { at3: 'at3' } });
  wrapper.setProps({ attributesFactory: { at4: 'at4' }, attributesClient: undefined });
  wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });

  wrapper.unmount()

  // clear clients attributes and spies for 2nd round of tests
  mainClientSpy.setAttributes.mockClear();
  mainClientSpy.clearAttributes.mockClear();
  mainClient.clearAttributes();
  clientSpy.setAttributes.mockClear();
  clientSpy.clearAttributes.mockClear();
  client.clearAttributes();
  renderTimes = 0;

  // @ts-ignore. With splitKey undefined, mainClient and client refer to the same client instance.
  wrapper = mount(<Component splitKey={undefined} attributesFactory={{ at1: 'at1' }} attributesClient={{ at2: 'at2' }} testSwitch={attributesBindingSwitch} factory={factory} />);

  wrapper.setProps({ attributesFactory: undefined, attributesClient: { at3: 'at3' } });
  wrapper.setProps({ attributesFactory: { at4: 'at4' }, attributesClient: undefined });
  wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });
}
