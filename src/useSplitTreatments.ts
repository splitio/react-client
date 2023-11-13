import React from 'react';
import { memoizeGetTreatmentsWithConfig } from './utils';
import { ISplitTreatmentsChildProps, IUseSplitTreatmentsOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * 'useSplitTreatments' is a hook that returns a SplitContext object extended with a `treatments` property, which contains an object of feature flag evaluations (i.e., treatments).
 * It utilizes the 'useSplitClient' hook to access the client from the context and invokes the 'getTreatmentsWithConfig' method
 * if `names` property is provided, or the 'getTreatmentsWithConfigByFlagSets' method if `flagSets` property is provided.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useSplitTreatments(options: IUseSplitTreatmentsOptions): ISplitTreatmentsChildProps {
  const context = useSplitClient({ ...options, attributes: undefined });
  const { client, lastUpdate } = context;
  const { names, flagSets, attributes } = options;

  const getTreatmentsWithConfig = React.useMemo(memoizeGetTreatmentsWithConfig, []);

  // Clone `client.getAttributes` result for memoization, because it returns the same reference unless `client.clearAttributes` is called.
  // Note: the same issue occurs with `names` and `attributes` arguments if the user mutates them directly instead of providing a new object.
  const treatments = getTreatmentsWithConfig(client, lastUpdate, names, attributes, client ? { ...client.getAttributes() } : {}, flagSets);

  return {
    ...context,
    treatments,
  };
}
