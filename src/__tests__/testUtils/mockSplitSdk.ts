import { EventEmitter } from 'events';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import jsSdkPackageJson from '@splitsoftware/splitio/package.json';
import reactSdkPackageJson from '../../../package.json';

export const jsSdkVersion = `javascript-${jsSdkPackageJson.version}`;
export const reactSdkVersion = `react-${reactSdkPackageJson.version}`;

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
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

export function mockSdk() {

  return jest.fn((config: SplitIO.IBrowserSettings, __updateModules) => {

    function mockClient(_key: SplitIO.SplitKey, _trafficType?: string) {
      // Readiness
      let isReady = false;
      let isReadyFromCache = config.preloadedData ? true : false;
      let hasTimedout = false;
      let isDestroyed = false;
      let lastUpdate = 0;

      function syncLastUpdate() {
        const dateNow = Date.now();
        lastUpdate = dateNow > lastUpdate ? dateNow : lastUpdate + 1;
      }

      const __emitter__ = new EventEmitter();
      __emitter__.on(Event.SDK_READY, () => { isReady = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_READY_FROM_CACHE, () => { isReadyFromCache = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_READY_TIMED_OUT, () => { hasTimedout = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_UPDATE, () => { syncLastUpdate(); });

      let attributesCache = {};

      // Client methods
      const track: jest.Mock = jest.fn(() => {
        return true;
      });
      const getTreatmentsWithConfig: jest.Mock = jest.fn((featureFlagNames: string[]) => {
        return featureFlagNames.reduce((result: SplitIO.TreatmentsWithConfig, featureName: string) => {
          result[featureName] = { treatment: 'on', config: null };
          return result;
        }, {});
      });
      const getTreatmentsWithConfigByFlagSets: jest.Mock = jest.fn((flagSets: string[]) => {
        return flagSets.reduce((result: SplitIO.TreatmentsWithConfig, flagSet: string) => {
          result[flagSet + '_feature_flag'] = { treatment: 'on', config: null };
          return result;
        }, {});
      });
      const setAttributes: jest.Mock = jest.fn((attributes) => {
        attributesCache = Object.assign(attributesCache, attributes);
        return true;
      });
      const clearAttributes: jest.Mock = jest.fn(() => {
        attributesCache = {};
        return true;
      });
      const getAttributes: jest.Mock = jest.fn(() => {
        return attributesCache;
      });
      const ready: jest.Mock = jest.fn(() => {
        return new Promise<void>((res, rej) => {
          if (isReady) res();
          else { __emitter__.on(Event.SDK_READY, res); }
          if (hasTimedout) rej();
          else { __emitter__.on(Event.SDK_READY_TIMED_OUT, rej); }
        });
      });
      const __getStatus = () => ({
        isReady,
        isReadyFromCache,
        isTimedout: hasTimedout && !isReady,
        hasTimedout,
        isDestroyed,
        isOperational: (isReady || isReadyFromCache) && !isDestroyed,
        lastUpdate,
      });
      const destroy: jest.Mock = jest.fn(() => {
        isDestroyed = true;
        syncLastUpdate();
        // __emitter__.removeAllListeners();
        return Promise.resolve();
      });

      return Object.assign(Object.create(__emitter__), {
        getTreatmentsWithConfig,
        getTreatmentsWithConfigByFlagSets,
        track,
        ready,
        destroy,
        Event,
        setAttributes,
        clearAttributes,
        getAttributes,
        // EventEmitter exposed to trigger events manually
        __emitter__,
        // Clients expose a `__getStatus` method, that is not considered part of the public API, to get client readiness status (isReady, isReadyFromCache, isOperational, hasTimedout, isDestroyed)
        __getStatus,
        // Restore the mock client to its initial NO-READY status.
        // Useful when you want to reuse the same mock between tests after emitting events or destroying the instance.
        __restore() {
          isReady = isReadyFromCache = hasTimedout = isDestroyed = false;
          lastUpdate = 0;
        }
      });
    }

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

    // Factory destroy
    const destroy = jest.fn(() => {
      return Promise.all(Object.keys(__clients__).map(instanceId => __clients__[instanceId].destroy()));
    });

    // SDK internal modules
    const modules = {
      settings: Object.assign({
        version: jsSdkVersion,
      }, config),
      isPure: undefined,
    }
    if (__updateModules) __updateModules(modules);

    // SDK factory
    const factory = {
      client,
      manager,
      destroy,
      __names__: names,
      __clients__,
      settings: modules.settings,
      init: modules.isPure ? jest.fn() : undefined
    };

    return factory;
  });

}
