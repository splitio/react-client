/**
 * 'useTrack' is a custom hook that returns the track method from a Split client.
 * It uses the 'useContext' hook to access the client from the Split context.
 *
 * @return A track function binded to a Split client. If the client is not available, the result is a no-op function that returns false.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#track}
 */
declare const useTrack: (key?: string | import("@splitsoftware/splitio/types/splitio").SplitKeyObject | undefined, trafficType?: string | undefined) => SplitIO.IBrowserClient['track'];
export default useTrack;
