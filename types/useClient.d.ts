/**
 * 'useClient' is a hook that returns a client from the Split context.
 * It uses the 'useContext' hook to access the context, which is updated by
 * SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Client instance, or null if used outside the scope of SplitFactory
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 *
 * @deprecated useSplitClient is the new hook to use.
 */
export declare function useClient(splitKey?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): SplitIO.IBrowserClient | null;
