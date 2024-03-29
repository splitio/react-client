import { useSplitClient } from './useSplitClient';

/**
 * 'useClient' is a hook that returns a client from the Split context.
 * It uses the 'useContext' hook to access the context, which is updated by
 * SplitFactoryProvider and SplitClient components in the hierarchy of components.
 *
 * @returns A Split Client instance, or null if used outside the scope of SplitFactoryProvider or factory is not ready.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 *
 * @deprecated Replace with the new `useSplitClient` hook.
 */
export function useClient(splitKey?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): SplitIO.IBrowserClient | null {
  return useSplitClient({ splitKey, trafficType, attributes }).client;
}
