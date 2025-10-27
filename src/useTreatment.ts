import * as React from 'react';
import { memoizeGetTreatment } from './utils';
import { IUseTreatmentResult, IUseTreatmentOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * `useTreatment` is a hook that returns an Split Context object extended with a `treatment` property.
 * It uses the `useSplitClient` hook to access the client, and invokes the `client.getTreatment()` method.
 *
 * @param options - An options object with a feature flag name to evaluate, and an optional `attributes` and `splitKey` values to configure the client.
 * @returns A Split Context object extended with a Treatment instance, that might be a control treatment if the client is not available or ready, or if the provided feature flag name does not exist.
 *
 * @example
 * ```js
 * const { treatment, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useTreatment({ name: 'feature_1'});
 * ```
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#multiple-evaluations-at-once}
 */
export function useTreatment(options: IUseTreatmentOptions): IUseTreatmentResult {
  const context = useSplitClient({ ...options, attributes: undefined });
  const { client, lastUpdate } = context;
  const { name, attributes, properties } = options;

  const getTreatment = React.useMemo(memoizeGetTreatment, []);

  // Shallow copy `client.getAttributes` result for memoization, as it returns the same reference unless `client.clearAttributes` is invoked.
  // Note: the same issue occurs with the `names` and `attributes` arguments if they are mutated directly by the user instead of providing a new object.
  const treatment = getTreatment(client, lastUpdate, [name], attributes, client ? { ...client.getAttributes() } : {}, undefined, properties && { properties });

  return {
    ...context,
    treatment,
  };
}
