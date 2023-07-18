import React from 'react';
import { getControlTreatmentsWithConfig } from './constants';
import { IClientWithContext, memoizeGetTreatmentsWithConfig } from './utils';
import { ISplitTreatmentsChildProps, IUpdateProps } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * 'useSplitTreatments' is a hook that returns an SplitContext object extended with a `treatments` property containing an object of feature flag evaluations (i.e., treatments).
 * It uses the 'useSplitClient' hook to access the client from the Split context, and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
// @TODO review and validate useMemo, review signature (options), document signature
export function useSplitTreatments(splitNames: string[], attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey, options?: IUpdateProps): ISplitTreatmentsChildProps {
  const context = useSplitClient(key, undefined, undefined, options);
  const client = context.client;

  // @TODO https://react.dev/reference/react/useMemo vs useCallback
  const getTreatmentsWithConfig = React.useMemo(memoizeGetTreatmentsWithConfig, []);

  const treatments = client && (client as IClientWithContext).__getStatus().isOperational ?
    getTreatmentsWithConfig(client, context.lastUpdate, splitNames, attributes, { ...client.getAttributes() }) :
    getControlTreatmentsWithConfig(splitNames);

  return {
    ...context,
    treatments,
  };
}
