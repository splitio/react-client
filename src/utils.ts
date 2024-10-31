import memoizeOne from 'memoize-one';
import shallowEqual from 'shallowequal';
import { SplitFactory } from '@splitsoftware/splitio/client';
import { CONTROL_WITH_CONFIG, VERSION, WARN_NAMES_AND_FLAGSETS } from './constants';
import { ISplitStatus } from './types';

// Utils used to access singleton instances of Split factories and clients, and to gracefully shutdown all clients together.

/**
 * ClientWithContext interface.
 */
export interface IClientWithContext extends SplitIO.IBrowserClient {
  __getStatus(): {
    isReady: boolean;
    isReadyFromCache: boolean;
    isTimedout: boolean;
    hasTimedout: boolean;
    isDestroyed: boolean;
    isOperational: boolean;
    lastUpdate: number;
  };
}

/**
 * FactoryWithClientInstances interface.
 */
export interface IFactoryWithLazyInit extends SplitIO.IBrowserSDK {
  config: SplitIO.IBrowserSettings;
  init(): void;
}

// exported for testing purposes
export const __factories: Map<SplitIO.IBrowserSettings, IFactoryWithLazyInit> = new Map();

// idempotent operation
export function getSplitFactory(config: SplitIO.IBrowserSettings) {
  if (!__factories.has(config)) {
    // SplitFactory is not an idempotent operation
    // @ts-expect-error. 2nd param is not part of type definitions. Used to overwrite the SDK version
    const newFactory = SplitFactory(config, (modules) => {
      modules.settings.version = VERSION;
      modules.lazyInit = true;
    }) as IFactoryWithLazyInit;
    newFactory.config = config;
    __factories.set(config, newFactory);
  }
  return __factories.get(config) as IFactoryWithLazyInit;
}

// idempotent operation
export function getSplitClient(factory: SplitIO.IBrowserSDK, key?: SplitIO.SplitKey): IClientWithContext {
  // factory.client is an idempotent operation
  const client = (key !== undefined ? factory.client(key) : factory.client()) as IClientWithContext;

  // Remove EventEmitter warning emitted when using multiple SDK hooks or components.
  // Unlike JS SDK, users don't need to access the client directly, making the warning irrelevant.
  client.setMaxListeners && client.setMaxListeners(0);

  return client;
}

export function destroySplitFactory(factory: IFactoryWithLazyInit): Promise<void> | undefined {
  __factories.delete(factory.config);
  return factory.destroy();
}

// Util used to get client status.
// It might be removed in the future, if the JS SDK extends its public API with a `getStatus` method
export function getStatus(client?: SplitIO.IBrowserClient): ISplitStatus {
  const status = client && (client as IClientWithContext).__getStatus();

  return {
    isReady: status ? status.isReady : false,
    isReadyFromCache: status ? status.isReadyFromCache : false,
    isTimedout: status ? status.isTimedout : false,
    hasTimedout: status ? status.hasTimedout : false,
    isDestroyed: status ? status.isDestroyed : false,
    lastUpdate: status ? status.lastUpdate : 0,
  };
}

/**
 * Manage client attributes binding
 */
export function initAttributes(client?: SplitIO.IBrowserClient, attributes?: SplitIO.Attributes) {
  if (client && attributes) client.setAttributes(attributes);
}

// Input validation utils that will be replaced eventually

function validateFeatureFlags(maybeFeatureFlags: unknown, listName = 'feature flag names'): false | string[] {
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

const TRIMMABLE_SPACES_REGEX = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/;

function validateFeatureFlag(maybeFeatureFlag: unknown, item = 'feature flag name'): false | string {
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

export function getControlTreatmentsWithConfig(featureFlagNames: unknown): SplitIO.TreatmentsWithConfig {
  // validate featureFlags Names
  const validatedFeatureFlagNames = validateFeatureFlags(featureFlagNames);

  // return empty object if the returned value is false
  if (!validatedFeatureFlagNames) return {};

  // return control treatments for each validated feature flag name
  return validatedFeatureFlagNames.reduce((pValue: SplitIO.TreatmentsWithConfig, cValue: string) => {
    pValue[cValue] = CONTROL_WITH_CONFIG;
    return pValue;
  }, {});
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

function evaluateFeatureFlags(client: SplitIO.IBrowserClient | undefined, _lastUpdate: number, names?: SplitIO.SplitNames, attributes?: SplitIO.Attributes, _clientAttributes?: SplitIO.Attributes, flagSets?: string[]) {
  if (names && flagSets) console.log(WARN_NAMES_AND_FLAGSETS);

  return client && (client as IClientWithContext).__getStatus().isOperational && (names || flagSets) ?
    names ?
      client.getTreatmentsWithConfig(names, attributes) :
      client.getTreatmentsWithConfigByFlagSets(flagSets!, attributes) :
    names ?
      getControlTreatmentsWithConfig(names) :
      {} // empty object when evaluating with flag sets and client is not ready
}
