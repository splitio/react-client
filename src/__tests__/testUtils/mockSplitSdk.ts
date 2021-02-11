import { EventEmitter } from 'events';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import jsSdkPackageJson from '@splitsoftware/splitio/package.json';
import reactSdkPackageJson from '../../../package.json';

export const jsSdkVersion = `javascript-${jsSdkPackageJson.version}`;
export const reactSdkVersion = `react-${reactSdkPackageJson.version}`;

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_UPDATE: 'state::update',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
};

function parseKey(key: SplitIO.SplitKey): SplitIO.SplitKey {
  if (key && typeof key === 'object' && key.constructor === Object) {
    return {
      matchingKey: (key as SplitIO.SplitKeyObject).matchingKey,
      bucketingKey: (key as SplitIO.SplitKeyObject).bucketingKey,
    };
  } else {
    return {
      matchingKey: (key as string),
      bucketingKey: (key as string),
    };
  }
}
function buildInstanceId(key: any, trafficType: string | undefined) {
  return `${key.matchingKey ? key.matchingKey : key}-${key.bucketingKey ? key.bucketingKey : key}-${trafficType !== undefined ? trafficType : ''}`;
}

function mockClient(key: SplitIO.SplitKey, trafficType?: string) {
  // Readiness
  let __isReady__: boolean | undefined;
  let __isReadyFromCache__: boolean | undefined;
  let __hasTimedout__: boolean | undefined;
  let __isDestroyed__: boolean | undefined;
  const __emitter__ = new EventEmitter();
  __emitter__.on(Event.SDK_READY, () => { __isReady__ = true; });
  __emitter__.on(Event.SDK_READY_FROM_CACHE, () => { __isReadyFromCache__ = true; });
  __emitter__.on(Event.SDK_READY_TIMED_OUT, () => { __hasTimedout__ = true; });
  const __internalListenersCount__ = {
    [Event.SDK_READY]: 1,
    [Event.SDK_READY_FROM_CACHE]: 1,
    [Event.SDK_READY_TIMED_OUT]: 1,
    [Event.SDK_UPDATE]: 0,
  };

  // Client methods
  const track: jest.Mock = jest.fn(() => {
    return true;
  });
  const getTreatmentsWithConfig: jest.Mock = jest.fn(() => {
    return 'getTreatmentsWithConfig';
  });
  const ready: jest.Mock = jest.fn(() => {
    return new Promise((res, rej) => {
      if (__isReady__) res();
      else { __internalListenersCount__[Event.SDK_READY]++; __emitter__.on(Event.SDK_READY, res); }
      if (__hasTimedout__) rej();
      else { __internalListenersCount__[Event.SDK_READY_TIMED_OUT]++; __emitter__.on(Event.SDK_READY_TIMED_OUT, rej); }
    });
  });
  const context = {
    constants: {
      READY: 'is_ready',
      READY_FROM_CACHE: 'is_ready_from_cache',
      HAS_TIMEDOUT: 'has_timedout',
      DESTROYED: 'is_destroyed',
    },
    get(name: string, flagCheck: boolean = false): boolean | undefined {
      if (flagCheck !== true) throw new Error('Don\'t use promise result on SDK context');
      switch (name) {
        case this.constants.READY:
          return __isReady__;
        case this.constants.READY_FROM_CACHE:
          return __isReadyFromCache__;
        case this.constants.HAS_TIMEDOUT:
          return __hasTimedout__;
        case this.constants.DESTROYED:
          return __isDestroyed__;
      }
    },
  };
  const destroy: jest.Mock = jest.fn(() => {
    __isDestroyed__ = true;
    return Promise.resolve();
  });

  return Object.assign(Object.create(__emitter__), {
    getTreatmentsWithConfig,
    track,
    ready,
    destroy,
    Event,
    // EventEmitter exposed to trigger events manually
    __emitter__,
    // Count of internal listeners set by the client mock, used to assert how many external listeners were attached
    __internalListenersCount__,
    // Factory context exposed to get client readiness status (READY, READY_FROM_CACHE, HAS_TIMEDOUT, DESTROYED)
    __context: context,
    // Restore the mock client to its initial NO-READY status.
    // Useful when you want to reuse the same mock between tests after emitting events or destroying the instance.
    __restore() {
      __isReady__ = __isReadyFromCache__ = __hasTimedout__ = __isDestroyed__ = undefined;
    }
  });
}

export function mockSdk() {

  return jest.fn((config: SplitIO.IBrowserSettings) => {

    // Manager
    const names: jest.Mock = jest.fn().mockReturnValue([]);
    const manager: jest.Mock = jest.fn().mockReturnValue({ names });

    // Cache of clients
    const __clients__: { [instanceId: string]: any } = {};
    const client = jest.fn((key?: string, trafficType?: string) => {
      const clientKey = key || parseKey(config.core.key);
      const clientTT = trafficType || config.core.trafficType;
      const instanceId = buildInstanceId(clientKey, clientTT);
      return __clients__[instanceId] || (__clients__[instanceId] = mockClient(clientKey, clientTT));
    });

    // SDK factory
    const factory = {
      client,
      manager,
      __names__: names,
      __clients__,
      settings: Object.assign({
        version: jsSdkVersion,
      }, config),
    };

    return factory;
  });

}

export function assertNoListeners(factory: any) {
  Object.values((factory as any).__clients__).forEach((client) => assertNoListenersOnClient(client));
}

function assertNoListenersOnClient(client: any) {
  expect(client.__emitter__.listenerCount(Event.SDK_READY)).toBe(client.__internalListenersCount__[Event.SDK_READY]);
  expect(client.__emitter__.listenerCount(Event.SDK_READY_FROM_CACHE)).toBe(client.__internalListenersCount__[Event.SDK_READY_FROM_CACHE]);
  expect(client.__emitter__.listenerCount(Event.SDK_READY_TIMED_OUT)).toBe(client.__internalListenersCount__[Event.SDK_READY_TIMED_OUT]);
  expect(client.__emitter__.listenerCount(Event.SDK_UPDATE)).toBe(client.__internalListenersCount__[Event.SDK_UPDATE]);
}
