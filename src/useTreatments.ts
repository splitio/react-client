import useClient from './useClient';
import { getControlTreatmentsWithConfig, ERROR_UT_NO_USECONTEXT } from './constants';
import { checkHooks, IClientWithContext } from './utils';

/**
 * 'useTreatments' is a custom hook that returns a list of treatments.
 * It uses the 'useContext' hook to access the client from the Split context,
 * and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
const useTreatments = (featureFlagNames: string[], attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey): SplitIO.TreatmentsWithConfig => {
  const client = checkHooks(ERROR_UT_NO_USECONTEXT) ? useClient(key) : null;
  return client && (client as IClientWithContext).__getStatus().isOperational ?
    client.getTreatmentsWithConfig(featureFlagNames, attributes) :
    getControlTreatmentsWithConfig(featureFlagNames);
};

export default useTreatments;
