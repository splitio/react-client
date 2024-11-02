import React from 'react';
import { memoizeGetTreatmentsWithConfig } from './utils';
import { ISplitTreatmentsChildProps, IUseSplitTreatmentsOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * `useSplitTreatments` is a hook that returns an Split Context object extended with a `treatments` property object that contains feature flag evaluations.
 * It uses the `useSplitClient` hook to access the client, and invokes the `client.getTreatmentsWithConfig()` method if the `names` option is provided,
 * or the `client.getTreatmentsWithConfigByFlagSets()` method if the `flagSets` option is provided.
 *
 * @param options - An options object with a list of feature flag names or flag sets to evaluate, and an optional `attributes` and `splitKey` values to configure the client.
 * @returns A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 *
 * @example
 * ```js
 * const { treatments: { feature_1, feature_2 }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useSplitTreatments({ names: ['feature_1', 'feature_2']});
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useSplitTreatments(options: IUseSplitTreatmentsOptions): ISplitTreatmentsChildProps {
  const context = useSplitClient({ ...options, attributes: undefined });
  const { client, lastUpdate } = context;
  const { names, flagSets, attributes } = options;

  const getTreatmentsWithConfig = React.useMemo(memoizeGetTreatmentsWithConfig, []);

  // Shallow copy `client.getAttributes` result for memoization, as it returns the same reference unless `client.clearAttributes` is invoked.
  // Note: the same issue occurs with the `names` and `attributes` arguments if they are mutated directly by the user instead of providing a new object.
  const treatments = getTreatmentsWithConfig(client, lastUpdate, names, attributes, client ? { ...client.getAttributes() } : {}, flagSets);

  return {
    ...context,
    treatments,
  };
}
