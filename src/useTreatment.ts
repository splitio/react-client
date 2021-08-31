import useClient from './useClient';
import { getControlTreatmentsWithConfig, ERROR_UT_NO_USECONTEXT } from './constants';
import { checkHooks } from './utils';

/**
 * 'useTreatment' is a custom hook that returns a treatment for a given split.
 * It uses the 'useContext' hook to access the client from the Split context,
 * and invokes the 'getTreatmentWithConfig' method.
 *
 * @return A TreatmentWithConfig instance, that might contain the control treatment if the client is not available or ready, or if split name does not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
const useTreatment = (splitName: string, attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey): SplitIO.TreatmentWithConfig => {
  const client = checkHooks(ERROR_UT_NO_USECONTEXT) ? useClient(key) : null;
  return client ?
    client.getTreatmentWithConfig(splitName, attributes) :
    getControlTreatmentsWithConfig([splitName])[0];
};

export default useTreatment;
