import { useSplitClient } from './useSplitClient';

// no-op function that returns false
const noOpFalse = () => false;

/**
 * 'useTrack' is a hook that retrieves the track method from a Split client.
 * It uses the 'useSplitClient' hook to access the client from the Split context.
 * Basically, it is a shortcut for `const track = useSplitClient().client?.track || (() => false);`.
 *
 * @returns A track function of the Split client. If the client is not available, the result is a no-op function that returns false.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#track}
 */
export function useTrack(splitKey?: SplitIO.SplitKey): SplitIO.IClient['track'] {
  // All update options are false to avoid re-renders. The track method doesn't need the client to be operational.
  const { client } = useSplitClient({ splitKey, updateOnSdkReady: false, updateOnSdkReadyFromCache: false });
  return client ? client.track : noOpFalse;
}
