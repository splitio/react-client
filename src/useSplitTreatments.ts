import React from 'react';
import { getControlTreatmentsWithConfig } from './constants';
import { IClientWithContext, memoizeGetTreatmentsWithConfig } from './utils';
import { ISplitTreatmentsChildProps, IUseSplitTreatmentsOptions } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * 'useSplitTreatments' is a hook that returns an SplitContext object extended with a `treatments` property containing an object of feature flag evaluations (i.e., treatments).
 * It uses the 'useSplitClient' hook to access the client from the Split context, and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useSplitTreatments(options: IUseSplitTreatmentsOptions): ISplitTreatmentsChildProps {
  const context = useSplitClient({...options, attributes: undefined });
  const { client, lastUpdate } = context;
  const { names, attributes } = options;

  const getTreatmentsWithConfig = React.useMemo(memoizeGetTreatmentsWithConfig, []);

  const treatments = client && (client as IClientWithContext).__getStatus().isOperational ?
    getTreatmentsWithConfig(client, lastUpdate, names, attributes, { ...client.getAttributes() }) :
    getControlTreatmentsWithConfig(names);

  return {
    ...context,
    treatments,
  };
}
