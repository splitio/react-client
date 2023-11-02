import { useSplitClient } from './useSplitClient';

// no-op function that returns false
const noOpFalse = () => false;

/**
 * 'useTrack' is a hook that returns the track method from a Split client.
 * It uses the 'useContext' hook to access the client from the Split context.
 *
 * @return A track function bound to a Split client. If the client is not available, the result is a no-op function that returns false.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#track}
 */
export function useTrack(splitKey?: SplitIO.SplitKey, trafficType?: string): SplitIO.IBrowserClient['track'] {
  // All update options are false to avoid re-renders. The track method doesn't need the client to be operational.
  const { client } = useSplitClient({ splitKey, trafficType, updateOnSdkReady: false, updateOnSdkReadyFromCache: false });
  return client ? client.track.bind(client) : noOpFalse;
}
