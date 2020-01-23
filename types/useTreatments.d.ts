/**
 * 'useTreatments' is a custom hook that returns a list of treatments.
 * It uses the 'useContext' hook to access the client from the Split context,
 * and invokes the 'getTreatmentsWithConfig' method.
 *
 * @return A TreatmentsWithConfig instance, that might contain control treatments if the client is not available or ready, or if split names do not exist.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
declare const useTreatments: (splitNames: string[], attributes?: import("@splitsoftware/splitio/types/splitio").Attributes | undefined, key?: string | import("@splitsoftware/splitio/types/splitio").SplitKeyObject | undefined) => import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
export default useTreatments;
