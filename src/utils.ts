import memoizeOne from 'memoize-one';
import shallowEqual from 'shallowequal';
import { CONTROL_WITH_CONFIG } from './constants';
import { ISplitStatus } from './types';

// Utils used to access singleton instances of Split factories and clients

export interface IFactoryWithLazyInit extends SplitIO.IBrowserSDK {
  config: SplitIO.IBrowserSettings;
  init(): void;
}

// idempotent operation
export function getSplitClient(factory: SplitIO.IBrowserSDK, key?: SplitIO.SplitKey): SplitIO.IBrowserClient {
  // factory.client is an idempotent operation
  const client = key !== undefined ? factory.client(key) : factory.client();

  // Remove EventEmitter warning emitted when using multiple SDK hooks or components.
  // Unlike JS SDK, users don't need to access the client directly, making the warning irrelevant.
  client.setMaxListeners && client.setMaxListeners(0);

  return client;
}

// Util used to get client status.
export function getStatus(client?: SplitIO.IBrowserClient): ISplitStatus {
  return client ?
    client.getStatus() :
    {
      isReady: false,
      isReadyFromCache: false,
      isTimedout: false,
      hasTimedout: false,
      isDestroyed: false,
      isOperational: false,
      lastUpdate: 0,
    };
}

/**
 * Manage client attributes binding
 */
// @TODO should reset attributes rather than set/merge them, to keep SFP and hooks pure.
export function initAttributes(client?: SplitIO.IBrowserClient, attributes?: SplitIO.Attributes) {
  if (client && attributes) client.setAttributes(attributes);
}

export function getControlTreatmentsWithConfig(featureFlagNames: unknown): SplitIO.TreatmentsWithConfig {
  if (!Array.isArray(featureFlagNames)) return {};

  featureFlagNames = featureFlagNames
    .filter((featureFlagName) => isString(featureFlagName))
    .map((featureFlagName) => featureFlagName.trim())
    .filter((featureFlagName) => featureFlagName.length > 0);

  // return control treatments for each validated feature flag name
  return (featureFlagNames as string[]).reduce((pValue: SplitIO.TreatmentsWithConfig, cValue: string) => {
    pValue[cValue] = CONTROL_WITH_CONFIG;
    return pValue;
  }, {});
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

function evaluateFeatureFlags(client: SplitIO.IBrowserClient | undefined, _lastUpdate: number, names?: SplitIO.SplitNames, attributes?: SplitIO.Attributes, _clientAttributes?: SplitIO.Attributes, flagSets?: string[], options?: SplitIO.EvaluationOptions) {
  return client && client.getStatus().isOperational && (names || flagSets) ?
    names ?
      client.getTreatmentsWithConfig(names, attributes, options) :
      client.getTreatmentsWithConfigByFlagSets(flagSets!, attributes, options) :
    names ?
      getControlTreatmentsWithConfig(names) :
      {} // empty object when evaluating with flag sets and client is not ready
}
