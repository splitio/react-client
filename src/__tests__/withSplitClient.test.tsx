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

  test('passes attributes to Splitclient', (done) => {

    let renderTimes = 0;

    // Auxiliar hoc to wrap factory component and set attributes to test
    function withComponentHoc(){
      return function withHOC<OuterProps>(
        WrappedComponent: React.ComponentType<OuterProps>
        ) {
        return (props: OuterProps) => {return (<WrappedComponent {...props}/>)}
      }
    }

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

    const Component = withComponentHoc()<{attrFactory: SplitIO.Attributes, attrClient: SplitIO.Attributes, splitKey: any}>(
      ({attrFactory, attrClient, splitKey}) => {
        const FactoryComponent = withSplitFactory(undefined, factory, attrFactory)<{attrClient: SplitIO.Attributes, splitKey: any}>(
          ({attrClient, splitKey}) => {
            const ClientComponent = withSplitClient(splitKey, 'user', attrClient)(
            () => {
              renderTimes++;
              switch (renderTimes) {
                case 1:
                  if (splitKey) {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(1);
                    expect(mainClientSpy.setAttributes).lastCalledWith({ at1: 'at1' });
                    expect(mainClient?.getAttributes()).toStrictEqual({ at1: 'at1' });
                    expect(clientSpy.clearAttributes).toBeCalledTimes(1);
                    expect(clientSpy.setAttributes).lastCalledWith({ at2: 'at2' });
                    expect(client?.getAttributes()).toStrictEqual({ at2: 'at2' });
                  } else {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(2);
                    expect(mainClientSpy.setAttributes).lastCalledWith({ at2: 'at2' });
                    expect(mainClient?.getAttributes()).toStrictEqual({ at2: 'at2' });
                    expect(clientSpy.clearAttributes).toBeCalledTimes(0);
                    expect(clientSpy.setAttributes).toBeCalledTimes(0);
                  }
                  break;
                case 2:
                  if (splitKey) {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(2);
                    expect(clientSpy.clearAttributes).toBeCalledTimes(2);
                    expect(clientSpy.setAttributes).lastCalledWith({at3: 'at3'});
                    expect(mainClient?.getAttributes()).toStrictEqual({});
                    expect(client?.getAttributes()).toStrictEqual({at3: 'at3'});
                  } else {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(4);
                    expect(mainClient?.setAttributes).lastCalledWith({ at3: 'at3' });
                    expect(mainClient?.getAttributes()).toStrictEqual({ at3: 'at3' });
                    expect(clientSpy.clearAttributes).toBeCalledTimes(0);
                    expect(clientSpy.setAttributes).toBeCalledTimes(0);
                  }
                  break;
                case 3:
                  if (splitKey) {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(3);
                    expect(mainClientSpy.setAttributes).lastCalledWith({at4: 'at4'});
                    expect(mainClient?.getAttributes()).toStrictEqual({at4: 'at4'});
                    expect(clientSpy.clearAttributes).toBeCalledTimes(3);
                    expect(client?.getAttributes()).toStrictEqual({});
                  } else {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(6);
                    expect(mainClientSpy.setAttributes).lastCalledWith({at4: 'at4'});
                    expect(mainClient?.getAttributes()).toStrictEqual({});
                    expect(clientSpy.clearAttributes).toBeCalledTimes(0);
                    expect(clientSpy.setAttributes).toBeCalledTimes(0);
                  }
                  break;
                case 4:
                  if (splitKey) {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(4);
                    expect(mainClient?.getAttributes()).toStrictEqual({});
                    expect(clientSpy.clearAttributes).toBeCalledTimes(4);
                    expect(client?.getAttributes()).toStrictEqual({});
                  } else {
                    expect(mainClientSpy.clearAttributes).toBeCalledTimes(8);
                    expect(mainClient?.getAttributes()).toStrictEqual({});
                    expect(clientSpy.clearAttributes).toBeCalledTimes(0);
                    expect(clientSpy.setAttributes).toBeCalledTimes(0);
                    done();
                  }
                  break;
              }
              return null;
            })
            return <ClientComponent />;
        });
        return <FactoryComponent attrClient={attrClient} splitKey={splitKey}/>
    });

    // @ts-ignore
    let wrapper = mount(<Component splitKey='user1' attrFactory={{ at1: 'at1' }} attrClient={{ at2: 'at2' }} />);

    wrapper.setProps({ attrFactory: undefined, attrClient: {at3: 'at3'} });
    wrapper.setProps({ attrFactory: {at4: 'at4'}, attrClient: undefined });
    wrapper.setProps({ attrFactory: undefined, attrClient: undefined });

    wrapper.unmount()

    mainClientSpy.setAttributes.mockClear();
    mainClientSpy.clearAttributes.mockClear();
    clientSpy.setAttributes.mockClear();
    clientSpy.clearAttributes.mockClear();
    renderTimes = 0;

    wrapper = mount(<Component splitKey={undefined} attrFactory={{ at1: 'at1' }} attrClient={{ at2: 'at2' }} />);

    wrapper.setProps({ attrFactory: undefined, attrClient: {at3: 'at3'} });
    wrapper.setProps({ attrFactory: {at4: 'at4'}, attrClient: undefined });
    wrapper.setProps({ attrFactory: undefined, attrClient: undefined });

  })
})
