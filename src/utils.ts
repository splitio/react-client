import shallowEqual from 'shallowequal';
import { CONTROL, CONTROL_WITH_CONFIG } from './constants';
import { ISplitStatus } from './types';

function isString(val: unknown): val is string {
  return typeof val === 'string' || val instanceof String;
}

// Utils used to access singleton instances of Split factories and clients:

export function getSplitClient(factory: SplitIO.IBrowserSDK, key?: SplitIO.SplitKey): SplitIO.IBrowserClient {
  // factory.client is an idempotent operation
  const client = key !== undefined ? factory.client(key) : factory.client();

  // Remove EventEmitter warning emitted when using multiple SDK hooks or components.
  // Unlike JS SDK, users don't need to access the client directly, making the warning irrelevant.
  client.setMaxListeners && client.setMaxListeners(0);

  return client;
}

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

// Manage client attributes binding
// @TODO should reset attributes rather than set/merge them, to keep SFP and hooks pure.
export function initAttributes(client?: SplitIO.IBrowserClient, attributes?: SplitIO.Attributes) {
  if (client && attributes) client.setAttributes(attributes);
}

// Utils used to retrieve fallback or control treatments when the client is not operational:

export function getTreatment(flagName: string, withConfig: true, factory?: SplitIO.IBrowserSDK): SplitIO.TreatmentWithConfig;
export function getTreatment(flagName: string, withConfig: false, factory?: SplitIO.IBrowserSDK): SplitIO.Treatment;
export function getTreatment(flagName: string, withConfig: boolean, factory?: SplitIO.IBrowserSDK): SplitIO.Treatment | SplitIO.TreatmentWithConfig;
export function getTreatment(flagName: string, withConfig: boolean, factory?: SplitIO.IBrowserSDK) {
  if (factory && factory.settings.fallbackTreatments) {
    const fallbacks = factory.settings.fallbackTreatments;

    const treatment = fallbacks.byFlag?.[flagName] || fallbacks.global;

    if (treatment) {
      return isString(treatment) ?
        withConfig ? { treatment, config: null } : treatment :
        withConfig ? treatment : treatment.treatment;
    }
  }

  return withConfig ? CONTROL_WITH_CONFIG : CONTROL;
}

export function getTreatments(featureFlagNames: unknown, withConfig: true, factory?: SplitIO.IBrowserSDK): SplitIO.TreatmentsWithConfig;
export function getTreatments(featureFlagNames: unknown, withConfig: false, factory?: SplitIO.IBrowserSDK): SplitIO.Treatments;
export function getTreatments(featureFlagNames: unknown, withConfig: boolean, factory?: SplitIO.IBrowserSDK) {
  // validate feature flag names
  if (!Array.isArray(featureFlagNames)) return {};

  featureFlagNames = featureFlagNames
    .filter((featureFlagName) => isString(featureFlagName))
    .map((featureFlagName) => featureFlagName.trim())
    .filter((featureFlagName) => featureFlagName.length > 0);

  // return control or fallback treatment for each validated feature flag name
  return (featureFlagNames as string[]).reduce((pValue: SplitIO.Treatments | SplitIO.TreatmentsWithConfig, featureFlagName: string) => {
    pValue[featureFlagName] = getTreatment(featureFlagName, withConfig, factory);
    return pValue;
  }, {});
}

/**
 * Utils to memoize `client.getTreatments*` method calls to avoid duplicated impressions.
 * The result treatments are the same given the same `client` instance, `lastUpdate` timestamp, and list of feature flag names and attributes.
 */

export function argsAreEqual(newArgs: any[], lastArgs: any[]): boolean {
  return newArgs[0] === lastArgs[0] && // client
    newArgs[1] === lastArgs[1] && // lastUpdate
    shallowEqual(newArgs[2], lastArgs[2]) && // names
    shallowEqual(newArgs[3], lastArgs[3]) && // attributes
    shallowEqual(newArgs[4], lastArgs[4]) && // client attributes
    shallowEqual(newArgs[5], lastArgs[5]); // flagSets
}
