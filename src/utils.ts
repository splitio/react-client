import memoizeOne from 'memoize-one';
import shallowEqual from 'shallowequal';
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { VERSION, WARN_NAMES_AND_FLAGSETS, getControlTreatmentsWithConfig } from './constants';
import { ISplitStatus } from './types';

// Utils used to access singleton instances of Split factories and clients, and to gracefully shutdown all clients together.

/**
 * ClientWithContext interface.
 */
export interface IClientWithContext extends SplitIO.IBrowserClient {
  __getStatus(): {
    isReady: boolean;
    isReadyFromCache: boolean;
    isOperational: boolean;
    hasTimedout: boolean;
    isDestroyed: boolean;
  };
  lastUpdate: number;
}

/**
 * FactoryWithClientInstances interface.
 */
export interface IFactoryWithClients extends SplitIO.IBrowserSDK {
  clientInstances: Set<IClientWithContext>;
  config: SplitIO.IBrowserSettings;
}

// exported for testing purposes
export const __factories: Map<SplitIO.IBrowserSettings, IFactoryWithClients> = new Map();

// idempotent operation
export function getSplitFactory(config: SplitIO.IBrowserSettings): IFactoryWithClients {
  if (!__factories.has(config)) {
    // SplitSDK is not an idempotent operation
    // @ts-expect-error. 2nd param is not part of type definitions. Used to overwrite the SDK version
    const newFactory = SplitSdk(config, (modules) => {
      modules.settings.version = VERSION;
    }) as IFactoryWithClients;
    newFactory.clientInstances = new Set();
    newFactory.config = config;
    __factories.set(config, newFactory);
  }
  return __factories.get(config) as IFactoryWithClients;
}

// idempotent operation
export function getSplitClient(factory: SplitIO.IBrowserSDK, key?: SplitIO.SplitKey, trafficType?: string): IClientWithContext {
  // factory.client is an idempotent operation
  const client = (key !== undefined ? factory.client(key, trafficType) : factory.client()) as IClientWithContext;

  // Handle client lastUpdate
  if (client.lastUpdate === undefined) {
    const updateLastUpdate = () => {
      const lastUpdate = Date.now();
      client.lastUpdate = lastUpdate > client.lastUpdate ? lastUpdate : client.lastUpdate + 1;
    }

    client.lastUpdate = 0;
    client.on(client.Event.SDK_READY, updateLastUpdate);
    client.on(client.Event.SDK_READY_FROM_CACHE, updateLastUpdate);
    client.on(client.Event.SDK_READY_TIMED_OUT, updateLastUpdate);
    client.on(client.Event.SDK_UPDATE, updateLastUpdate);
  }

  if ((factory as IFactoryWithClients).clientInstances) {
    (factory as IFactoryWithClients).clientInstances.add(client);
  }
  return client;
}

export function destroySplitFactory(factory: IFactoryWithClients): Promise<void[]> {
  // call destroy of clients
  const destroyPromises: Promise<void>[] = [];
  factory.clientInstances.forEach((client) => destroyPromises.push(client.destroy()));
  // remove references to release allocated memory
  factory.clientInstances.clear();
  __factories.delete(factory.config);
  return Promise.all(destroyPromises);
}

// Util used to get client status.
// It might be removed in the future, if the JS SDK extends its public API with a `getStatus` method
export function getStatus(client: SplitIO.IBrowserClient | null): ISplitStatus {
  const status = client && (client as IClientWithContext).__getStatus();
  const isReady = status ? status.isReady : false;
  const hasTimedout = status ? status.hasTimedout : false;
  return {
    isReady,
    isReadyFromCache: status ? status.isReadyFromCache : false,
    isTimedout: hasTimedout && !isReady,
    hasTimedout,
    isDestroyed: status ? status.isDestroyed : false,
    lastUpdate: client ? (client as IClientWithContext).lastUpdate || 0 : 0,
  };
}

// Input validation utils that will be replaced eventually

export function validateFeatureFlags(maybeFeatureFlags: unknown, listName = 'split names'): false | string[] {
  if (Array.isArray(maybeFeatureFlags) && maybeFeatureFlags.length > 0) {
    const validatedArray: string[] = [];
    // Remove invalid values
    maybeFeatureFlags.forEach((maybeFeatureFlag) => {
      const featureFlagName = validateFeatureFlag(maybeFeatureFlag);
      if (featureFlagName) validatedArray.push(featureFlagName);
    });

    // Strip off duplicated values if we have valid feature flag names then return
    if (validatedArray.length) return uniq(validatedArray);
  }

  console.log(`[ERROR] ${listName} must be a non-empty array.`);
  return false;
}

/**
 * Manage client attributes binding
 */
export function initAttributes(client: SplitIO.IBrowserClient | null, attributes?: SplitIO.Attributes) {
  if (client && attributes) client.setAttributes(attributes);
}

const TRIMMABLE_SPACES_REGEX = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/;

function validateFeatureFlag(maybeFeatureFlag: unknown, item = 'split name'): false | string {
  if (maybeFeatureFlag == undefined) {
    console.log(`[ERROR] you passed a null or undefined ${item}, ${item} must be a non-empty string.`);
  } else if (!isString(maybeFeatureFlag)) {
    console.log(`[ERROR] you passed an invalid ${item}, ${item} must be a non-empty string.`);
  } else {
    if (TRIMMABLE_SPACES_REGEX.test(maybeFeatureFlag)) {
      console.log(`[WARN] ${item} "${maybeFeatureFlag}" has extra whitespace, trimming.`);
      maybeFeatureFlag = maybeFeatureFlag.trim();
    }

    if ((maybeFeatureFlag as string).length > 0) {
      return maybeFeatureFlag as string;
    } else {
      console.log(`[ERROR] you passed an empty ${item}, ${item} must be a non-empty string.`);
    }
  }

  return false;
}

/**
 * Removes duplicate items on an array of strings.
 */
function uniq(arr: string[]): string[] {
  const seen: Record<string, boolean> = {};
  return arr.filter((item) => {
    return Object.prototype.hasOwnProperty.call(seen, item) ? false : seen[item] = true;
  });
}

/**
 * Checks if a given value is a string.
 */
function isString(val: unknown): val is string {
  return typeof val === 'string' || val instanceof String;
}

/**
 * Gets a memoized version of the `client.getTreatmentsWithConfig` method.
 * It is used to avoid duplicated impressions, because the result treatments are the same given the same `client` instance, `lastUpdate` timestamp, and list of feature flag `names` and `attributes`.
 */
export function memoizeGetTreatmentsWithConfig() {
  return memoizeOne(evaluateFeatureFlags, argsAreEqual);
}

function argsAreEqual(newArgs: any[], lastArgs: any[]): boolean {
  return newArgs[0] === lastArgs[0] && // client
    newArgs[1] === lastArgs[1] && // lastUpdate
    shallowEqual(newArgs[2], lastArgs[2]) && // names
    shallowEqual(newArgs[3], lastArgs[3]) && // attributes
    shallowEqual(newArgs[4], lastArgs[4]) && // client attributes
    shallowEqual(newArgs[5], lastArgs[5]); // flagSets
}

function evaluateFeatureFlags(client: SplitIO.IBrowserClient | null, _lastUpdate: number, names?: SplitIO.SplitNames, attributes?: SplitIO.Attributes, _clientAttributes?: SplitIO.Attributes, flagSets?: string[]) {
  if (names && flagSets) console.log(WARN_NAMES_AND_FLAGSETS);

  return client && (client as IClientWithContext).__getStatus().isOperational && (names || flagSets) ?
    names ?
      client.getTreatmentsWithConfig(names, attributes) :
      client.getTreatmentsWithConfigByFlagSets(flagSets!, attributes) :
    names ?
      getControlTreatmentsWithConfig(names) :
      {}
}
