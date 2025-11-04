import * as React from 'react';
import { memoizeGetTreatmentWithConfig } from './utils';
import { IUseTreatmentWithConfigResult, IUseTreatmentOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * `useTreatmentWithConfig` is a hook that returns an Split Context object extended with a `treatment` property.
 * It uses the `useSplitClient` hook to access the client, and invokes the `client.getTreatmentWithConfig()` method.
 *
 * @param options - An options object with a feature flag name to evaluate, and an optional `attributes` and `splitKey` values to configure the client.
 * @returns A Split Context object extended with a TreatmentWithConfig instance, that might be a control treatment if the client is not available or ready, or if the provided feature flag name does not exist.
 *
 * @example
 * ```js
 * const { treatment: { treatment, config }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useTreatmentWithConfig({ name: 'feature_1'});
 * ```
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#get-treatments-with-configurations}
 */
export function useTreatmentWithConfig(options: IUseTreatmentOptions): IUseTreatmentWithConfigResult {
  const context = useSplitClient({ ...options, attributes: undefined });
  const { factory, client, lastUpdate } = context;
  const { name, attributes, properties } = options;

  const getTreatmentWithConfig = React.useMemo(memoizeGetTreatmentWithConfig, []);

  // Shallow copy `client.getAttributes` result for memoization, as it returns the same reference unless `client.clearAttributes` is invoked.
  // Note: the same issue occurs with the `names` and `attributes` arguments if they are mutated directly by the user instead of providing a new object.
  const treatment = getTreatmentWithConfig(client, lastUpdate, [name], attributes, client ? { ...client.getAttributes() } : {}, undefined, properties && { properties }, factory);

  return {
    ...context,
    treatment,
  };
}
