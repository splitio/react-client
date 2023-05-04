import { getControlTreatmentsWithConfig, ERROR_UT_NO_USECONTEXT } from './constants';
import { checkHooks, IClientWithContext } from './utils';
import { ISplitTreatmentsChildProps } from './types';
import { INITIAL_CONTEXT } from './SplitContext';
import { useClientAndContext } from './useClientAndContext';

/**
 * 'useTreatmentsAndContext' is a hook that returns an SplitContext object extended with a `treatments` property containing an object of feature flag evaluations (i.e., treatments).
 * It uses the 'useClientAndContext' hook to access the client from the Split context, and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function useTreatmentsAndContext(splitNames: string[], attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey): ISplitTreatmentsChildProps {
  const context = checkHooks(ERROR_UT_NO_USECONTEXT) ? useClientAndContext(key) : INITIAL_CONTEXT;
  const client = context.client;
  const treatments = client && (client as IClientWithContext).__getStatus().isOperational ?
    client.getTreatmentsWithConfig(splitNames, attributes) :
    getControlTreatmentsWithConfig(splitNames);

  return {
    ...context,
    treatments,
  };
}
