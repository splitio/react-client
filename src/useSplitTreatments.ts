import React from 'react';
import { memoizeGetTreatmentsWithConfig } from './utils';
import { IUseSplitClientResult, IUseSplitTreatmentsOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * 'useSplitTreatments' is a hook that returns an SplitContext object extended with a `treatments` property object that contains feature flag evaluations.
 * It uses the 'useSplitClient' hook to access the client from the Split context, and invokes the 'client.getTreatmentsWithConfig()' method if the `names` option is provided,
 * or the 'client.getTreatmentsWithConfigByFlagSets()' method if the `flagSets` option is provided.
 *
 * @returns A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 *
 * @example
 * ```js
 * const { treatments: { feature_1, feature_2 }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useSplitTreatments({ names: ['feature_1', 'feature_2']});
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useSplitTreatments(options: IUseSplitTreatmentsOptions): IUseSplitClientResult & {

  /**
   * An object with the treatments with configs for a bulk of feature flags, returned by client.getTreatmentsWithConfig().
   * Each existing configuration is a stringified version of the JSON you defined on the Split user interface. For example:
   *
   * ```js
   *   {
   *     feature1: { treatment: 'on', config: null },
   *     feature2: { treatment: 'off', config: '{"bannerText":"Click here."}' }
   *   }
   * ```
   */
  treatments: SplitIO.TreatmentsWithConfig;
} {
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
