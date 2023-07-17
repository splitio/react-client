import { IUpdateProps } from './types';
/**
 * 'useTreatments' is a hook that returns an object of feature flag evaluations (i.e., treatments).
 * It uses the 'useContext' hook to access the client from the Split context,
 * and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export declare function useTreatments(featureFlagNames: string[], attributes?: SplitIO.Attributes, key?: SplitIO.SplitKey, options?: IUpdateProps): SplitIO.TreatmentsWithConfig;
