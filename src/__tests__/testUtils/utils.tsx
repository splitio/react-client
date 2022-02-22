import React from 'react';
import { mount } from 'enzyme';
// @ts-ignore. No declaration file
import { SplitFactory as originalSplitFactory } from '../../../lib/splitio/index';

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

export function testAttributesBinding(Component: React.FunctionComponent<any> | React.ComponentClass<any>) {

  let renderTimes = 0
  const factory = newSplitFactoryLocalhostInstance()

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

  // this function is called inside the received component
  function attributesBindingSwitch(done: any, splitKey?: SplitIO.SplitKey) {
    renderTimes++;
    switch (renderTimes) {
      case 1:
        if (splitKey) {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(mainClientSpy.setAttributes).lastCalledWith({ at1: 'at1' });
          expect(mainClient?.getAttributes()).toStrictEqual({ at1: 'at1' });
          expect(clientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(clientSpy.setAttributes).lastCalledWith({ at2: 'at2' });
          expect(client?.getAttributes()).toStrictEqual({ at2: 'at2' });
        } else {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes * 2);
          expect(mainClientSpy.setAttributes).lastCalledWith({ at2: 'at2' });
          expect(mainClient?.getAttributes()).toStrictEqual({ at2: 'at2' });
          expect(clientSpy.clearAttributes).toBeCalledTimes(0);
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 2:
        if (splitKey) {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(mainClient?.getAttributes()).toStrictEqual({});
          expect(clientSpy.setAttributes).lastCalledWith({ at3: 'at3' });
          expect(clientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(client?.getAttributes()).toStrictEqual({ at3: 'at3' });
        } else {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes * 2);
          expect(mainClient?.setAttributes).lastCalledWith({ at3: 'at3' });
          expect(mainClient?.getAttributes()).toStrictEqual({ at3: 'at3' });
          expect(clientSpy.clearAttributes).toBeCalledTimes(0);
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 3:
        if (splitKey) {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(mainClientSpy.setAttributes).lastCalledWith({ at4: 'at4' });
          expect(mainClient?.getAttributes()).toStrictEqual({ at4: 'at4' });
          expect(clientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(client?.getAttributes()).toStrictEqual({});
        } else {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes * 2);
          expect(mainClientSpy.setAttributes).lastCalledWith({ at4: 'at4' });
          expect(mainClient?.getAttributes()).toStrictEqual({});
          expect(clientSpy.clearAttributes).toBeCalledTimes(0);
          expect(clientSpy.setAttributes).toBeCalledTimes(0);
        }
        break;
      case 4:
        if (splitKey) {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(mainClient?.getAttributes()).toStrictEqual({});
          expect(clientSpy.clearAttributes).toBeCalledTimes(renderTimes);
          expect(client?.getAttributes()).toStrictEqual({});
        } else {
          expect(mainClientSpy.clearAttributes).toBeCalledTimes(renderTimes * 2);
          expect(mainClient?.getAttributes()).toStrictEqual({});
          expect(clientSpy.clearAttributes).toBeCalledTimes(0);
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

  mainClientSpy.setAttributes.mockClear();

  mainClientSpy.clearAttributes.mockClear();
  clientSpy.setAttributes.mockClear();
  clientSpy.clearAttributes.mockClear();
  renderTimes = 0;

  wrapper = mount(<Component splitKey={undefined} attributesFactory={{ at1: 'at1' }} attributesClient={{ at2: 'at2' }} testSwitch={attributesBindingSwitch} factory={factory} />);

  wrapper.setProps({ attributesFactory: undefined, attributesClient: { at3: 'at3' } });
  wrapper.setProps({ attributesFactory: { at4: 'at4' }, attributesClient: undefined });
  wrapper.setProps({ attributesFactory: undefined, attributesClient: undefined });

}