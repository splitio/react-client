import { useSplitClient } from './useSplitClient';

// no-op function that returns false
const noOpFalse = () => false;

/**
 * `useTrack` is a hook that retrieves the track method from a Split client.
 *
 * @returns The track method of the Split client for the provided user key. If the client is not available, the result is a no-op function that returns false.
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#track}
 */
export function useTrack(splitKey?: SplitIO.SplitKey): SplitIO.IBrowserClient['track'] {
  // All update options are false to avoid re-renders. The track method doesn't need the client to be operational.
  const { client } = useSplitClient({ splitKey, updateOnSdkReady: false, updateOnSdkReadyFromCache: false, updateOnSdkTimedout: false, updateOnSdkUpdate: false });

  // Retrieve the client `track` rather than a bound version of it, as there is no need to bind the function, and can be used as a reactive dependency that only changes if the underlying client changes.
  return client ? client.track : noOpFalse;
}
