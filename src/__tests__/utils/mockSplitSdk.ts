import { EventEmitter } from 'events';
import { IBrowserSettings } from '@splitsoftware/splitio/types/splitio';

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_UPDATE: 'state::update',
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
  let __isReady__ = false;
  let __isTimedout__ = false;
  const __emitter__ = new EventEmitter();
  __emitter__.once(Event.SDK_READY, () => { __isReady__ = true; });
  __emitter__.once(Event.SDK_READY_TIMED_OUT, () => { __isTimedout__ = true; });

  // Client methods
  const track: jest.Mock = jest.fn(() => {
    return true;
  });
  const getTreatmentsWithConfig: jest.Mock = jest.fn(() => {
    return 'getTreatmentsWithConfig';
  });
  const ready: jest.Mock = jest.fn(() => {
    return new Promise((res, rej) => {
      __isReady__ ? res() : __emitter__.on(Event.SDK_READY, res);
      __isTimedout__ ? rej() : __emitter__.on(Event.SDK_READY_TIMED_OUT, rej);
    });
  });

  return Object.assign(Object.create(__emitter__), {
    getTreatmentsWithConfig,
    track,
    ready,
    Event,
    // EventEmitter exposed to trigger events manually
    __emitter__,
  });
}

export function mockSdk() {

  return jest.fn((config: IBrowserSettings) => {

    // Manager
    const names: jest.Mock = jest.fn().mockReturnValue([]);
    const manager: jest.Mock = jest.fn().mockReturnValue({ names });

    // Cache of clients
    const __clients__: { [key: string]: any } = {};
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
      settings: {
        version: 'mock-x.x.x'
      }
    };

    return factory;
  });

}
