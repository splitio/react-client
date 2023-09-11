import { getControlTreatmentsWithConfig } from './constants';
import { IClientWithContext } from './utils';
import { ISplitTreatmentsChildProps } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * 'useSplitTreatments' is a hook that returns an SplitContext object extended with a `treatments` property containing an object of feature flag evaluations (i.e., treatments).
 * It uses the 'useSplitClient' hook to access the client from the Split context, and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useSplitTreatments(splitNames: string[], attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey): ISplitTreatmentsChildProps {
  const context = useSplitClient(key);
  const client = context.client;
  const treatments = client && (client as IClientWithContext).__getStatus().isOperational ?
    client.getTreatmentsWithConfig(splitNames, attributes) :
    getControlTreatmentsWithConfig(splitNames);

  return {
    ...context,
    treatments,
  };
}
