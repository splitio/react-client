import { EventEmitter } from 'events';
import jsSdkPackageJson from '@splitsoftware/splitio/package.json';
import reactSdkPackageJson from '../../../package.json';
import { CONTROL, CONTROL_WITH_CONFIG } from '../../constants';

export const jsSdkVersion = `javascript-${jsSdkPackageJson.version}`;
export const reactSdkVersion = `react-${reactSdkPackageJson.version}`;

export const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_READY_FROM_CACHE: 'init::cache-ready',
  SDK_UPDATE: 'state::update',
};

const DEFAULT_LOGGER: SplitIO.Logger = {
  error(msg) { console.log('[ERROR] splitio => ' + msg); },
  warn(msg) { console.log('[WARN]  splitio => ' + msg); },
  info(msg) { console.log('[INFO]  splitio => ' + msg); },
  debug(msg) { console.log('[DEBUG] splitio => ' + msg); },
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
function buildInstanceId(key: any, trafficType?: string) {
  return `${key.matchingKey ? key.matchingKey : key}-${key.bucketingKey ? key.bucketingKey : key}-${trafficType !== undefined ? trafficType : ''}`;
}

export function mockSdk() {

  return jest.fn((config: SplitIO.IBrowserSettings, __updateModules) => {

    function mockClient(_key: SplitIO.SplitKey) {
      // Readiness
      let isReady = false;
      let isReadyFromCache = false;
      let hasTimedout = false;
      let isDestroyed = false;
      let lastUpdate = 0;

      function syncLastUpdate() {
        const dateNow = Date.now();
        lastUpdate = dateNow > lastUpdate ? dateNow : lastUpdate + 1;
      }

      const __emitter__ = new EventEmitter();
      __emitter__.on(Event.SDK_READY, () => { isReady = true; isReadyFromCache = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_READY_FROM_CACHE, () => { isReadyFromCache = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_READY_TIMED_OUT, () => { hasTimedout = true; syncLastUpdate(); });
      __emitter__.on(Event.SDK_UPDATE, () => { syncLastUpdate(); });

      let attributesCache = {};

      // Client methods
      const track: jest.Mock = jest.fn(() => {
        return true;
      });
      const getTreatment: jest.Mock = jest.fn((featureFlagName: string) => {
        return typeof featureFlagName === 'string' ? 'on' : CONTROL;
      });
      const getTreatments: jest.Mock = jest.fn((featureFlagNames: string[]) => {
        return featureFlagNames.reduce((result: SplitIO.Treatments, featureName: string) => {
          result[featureName] = 'on';
          return result;
        }, {});
      });
      const getTreatmentsByFlagSets: jest.Mock = jest.fn((flagSets: string[]) => {
        return flagSets.reduce((result: SplitIO.Treatments, flagSet: string) => {
          result[flagSet + '_feature_flag'] = 'on';
          return result;
        }, {});
      });
      const getTreatmentWithConfig: jest.Mock = jest.fn((featureFlagName: string) => {
        return typeof featureFlagName === 'string' ? { treatment: 'on', config: null } : CONTROL_WITH_CONFIG;
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
      const getStatus = () => ({
        isReady,
        isReadyFromCache,
        isTimedout: hasTimedout && !isReady,
        hasTimedout,
        isDestroyed,
        isOperational: isReadyFromCache && !isDestroyed,
        lastUpdate,
      });
      const destroy: jest.Mock = jest.fn(() => {
        isDestroyed = true;
        syncLastUpdate();
        // __emitter__.removeAllListeners();
        return Promise.resolve();
      });

      return Object.assign(Object.create(__emitter__), {
        getTreatment,
        getTreatments,
        getTreatmentsByFlagSets,
        getTreatmentWithConfig,
        getTreatmentsWithConfig,
        getTreatmentsWithConfigByFlagSets,
        track,
        ready,
        destroy,
        Event,
        setAttributes,
        clearAttributes,
        getAttributes,
        getStatus,
        // EventEmitter exposed to trigger events manually
        __emitter__,
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
    const client = jest.fn((key?: string) => {
      const clientKey = key || parseKey(config.core.key);
      const instanceId = buildInstanceId(clientKey);
      return __clients__[instanceId] || (__clients__[instanceId] = mockClient(clientKey));
    });

    // Factory destroy
    const destroy = jest.fn(() => {
      return Promise.all(Object.keys(__clients__).map(instanceId => __clients__[instanceId].destroy()));
    });

    // SDK factory
    const factory = {
      client,
      manager,
      destroy,
      __names__: names,
      __clients__,
      settings: Object.assign({
        version: jsSdkVersion,
        log: DEFAULT_LOGGER
      }, config),
    };

    if (__updateModules) __updateModules(factory);

    return factory;
  });

}

export function getLastInstance(SplitFactoryMock: any) {
  return SplitFactoryMock.mock.results.slice(-1)[0].value;
}
