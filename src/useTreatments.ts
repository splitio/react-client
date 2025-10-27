import * as React from 'react';
import { memoizeGetTreatments } from './utils';
import { IUseTreatmentsResult, IUseTreatmentsOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * `useTreatments` is a hook that returns an Split Context object extended with a `treatments` property object that contains feature flag evaluations.
 * It uses the `useSplitClient` hook to access the client, and invokes the `client.getTreatments()` method if the `names` option is provided,
 * or the `client.getTreatmentsByFlagSets()` method if the `flagSets` option is provided.
 *
 * @param options - An options object with a list of feature flag names or flag sets to evaluate, and an optional `attributes` and `splitKey` values to configure the client.
 * @returns A Split Context object extended with a Treatments instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 *
 * @example
 * ```js
 * const { treatments: { feature_1, feature_2 }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useTreatments({ names: ['feature_1', 'feature_2']});
 * ```
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#multiple-evaluations-at-once}
 */
export function useTreatments(options: IUseTreatmentsOptions): IUseTreatmentsResult {
  const context = useSplitClient({ ...options, attributes: undefined });
  const { client, lastUpdate } = context;
  const { names, flagSets, attributes, properties } = options;

  const getTreatments = React.useMemo(memoizeGetTreatments, []);

  // Shallow copy `client.getAttributes` result for memoization, as it returns the same reference unless `client.clearAttributes` is invoked.
  // Note: the same issue occurs with the `names` and `attributes` arguments if they are mutated directly by the user instead of providing a new object.
  const treatments = getTreatments(client, lastUpdate, names, attributes, client ? { ...client.getAttributes() } : {}, flagSets, properties && { properties });

  return {
    ...context,
    treatments,
  };
}
