import { useClient } from './useClient';

// no-op function that returns false
const noOpFalse = () => false;

/**
 * 'useTrack' is a hook that returns the track method from a Split client.
 * It uses the 'useContext' hook to access the client from the Split context.
 *
 * @return A track function binded to a Split client. If the client is not available, the result is a no-op function that returns false.
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#track}
 */
export function useTrack(key?: SplitIO.SplitKey, trafficType?: string): SplitIO.IBrowserClient['track'] {
  const client = useClient(key, trafficType, undefined, { updateOnSdkReady: false, updateOnSdkReadyFromCache: false });
  return client ? client.track.bind(client) : noOpFalse;
}
