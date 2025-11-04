import { ISplitTreatmentsChildProps, IUseSplitTreatmentsOptions } from './types';
import { useTreatmentsWithConfig } from '.';

/**
 * `useSplitTreatments` is a hook that returns an Split Context object extended with a `treatments` property object that contains feature flag evaluations.
 * It uses the `useSplitClient` hook to access the client, and invokes the `client.getTreatmentsWithConfig()` method if the `names` option is provided,
 * or the `client.getTreatmentsWithConfigByFlagSets()` method if the `flagSets` option is provided.
 *
 * @param options - An options object with a list of feature flag names or flag sets to evaluate, and an optional `attributes` and `splitKey` values to configure the client.
 * @returns A Split Context object extended with a TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if feature flag names do not exist.
 *
 * @example
 * ```js
 * const { treatments: { feature_1, feature_2 }, isReady, isReadyFromCache, hasTimedout, lastUpdate, ... } = useSplitTreatments({ names: ['feature_1', 'feature_2']});
 * ```
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#get-treatments-with-configurations}
 *
 * @deprecated `useSplitTreatments` will be removed in a future major release. We recommend replacing it with the `useTreatment*` hooks.
 */
export function useSplitTreatments(options: IUseSplitTreatmentsOptions): ISplitTreatmentsChildProps {
  return useTreatmentsWithConfig(options);
}
