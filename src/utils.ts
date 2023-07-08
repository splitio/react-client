import React from 'react';
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { VERSION } from './constants';

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
  const client = (key ? factory.client(key, trafficType) : factory.client()) as IClientWithContext;
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

// Utils used to access client status.
// They might be removed in the future, if the JS SDK extends its public API with a `getStatus` method

export interface IClientStatus {
  isReady: boolean;
  isReadyFromCache: boolean;
  hasTimedout: boolean;
  isTimedout: boolean;
  isDestroyed: boolean;
}

export function getStatus(client: SplitIO.IBrowserClient | null): IClientStatus {
  const status = client && (client as IClientWithContext).__getStatus();
  const isReady = status ? status.isReady : false;
  const hasTimedout = status ? status.hasTimedout : false;
  return {
    isReady,
    isReadyFromCache: status ? status.isReadyFromCache : false,
    isTimedout: hasTimedout && !isReady,
    hasTimedout,
    isDestroyed: status ? status.isDestroyed : false,
  };
}

// Other utils

/**
 * Checks if React.useContext is available, and logs given message if not
 *
 * @param message
 * @returns boolean indicating if React.useContext is available
 */
export function checkHooks(message: string): boolean {
  if (!React.useContext) {
    console.log(message);
    return false;
  } else {
    return true;
  }
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
