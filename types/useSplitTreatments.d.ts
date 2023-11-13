import { ISplitTreatmentsChildProps, IUseSplitTreatmentsOptions } from './types';
/**
 * 'useSplitTreatments' is a hook that returns an SplitContext object extended with a `treatments` property object that contains feature flag evaluations.
 * It uses the 'useSplitClient' hook to access the client from the Split context, and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 *
 * @example
 * ```js
 * const { treatments: { feature_1, feature_2 }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useSplitTreatments({ names: ['feature_1', 'feature_2']});
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export declare function useSplitTreatments(options: IUseSplitTreatmentsOptions): ISplitTreatmentsChildProps;
