/**
 * ClientWithContext interface.
 */
export interface IClientWithContext extends SplitIO.IBrowserClient {
    __getStatus(): {
        isReady: boolean;
        isReadyFromCache: boolean;
        isOperational: boolean;
        hasTimedout: boolean;
        isDestroyed: boolean;
    };
}
/**
 * FactoryWithClientInstances interface.
 */
export interface IFactoryWithClients extends SplitIO.IBrowserSDK {
    sharedClientInstances: Set<IClientWithContext>;
    config: SplitIO.IBrowserSettings;
}
export declare const __factories: Map<SplitIO.IBrowserSettings, IFactoryWithClients>;
export declare function getSplitFactory(config: SplitIO.IBrowserSettings): IFactoryWithClients;
export declare function getSplitSharedClient(factory: SplitIO.IBrowserSDK, key: SplitIO.SplitKey, trafficType?: string): IClientWithContext;
export declare function destroySplitFactory(factory: IFactoryWithClients): Promise<void[]>;
export interface IClientStatus {
    isReady: boolean;
    isReadyFromCache: boolean;
    hasTimedout: boolean;
    isTimedout: boolean;
    isDestroyed: boolean;
}
export declare function getStatus(client: SplitIO.IBrowserClient | null): IClientStatus;
/**
 * Checks if React.useContext is available, and logs given message if not.
 * Checking for React.useContext is a way to detect if the current React version is >= 16.8.0 and other hooks used by the SDK are available too.
 *
 * @param message
 * @returns boolean indicating if React.useContext is available
 */
export declare function checkHooks(message: string): boolean;
export declare function validateFeatureFlags(maybeFeatureFlags: unknown, listName?: string): false | string[];
/**
 * Manage client attributes binding
 */
export declare function initAttributes(client: SplitIO.IBrowserClient | null, attributes?: SplitIO.Attributes): void;
/**
 * Gets a memoized version of the `client.getTreatmentsWithConfig` method.
 * It is used to avoid duplicated impressions, because the result treatments are the same given the same `client` instance, `lastUpdate` timestamp, and list of feature flag `names` and `attributes`.
 */
export declare function memoizeGetTreatmentsWithConfig(): typeof evaluateFeatureFlags;
declare function evaluateFeatureFlags(client: SplitIO.IBrowserClient, lastUpdate: number, names: SplitIO.SplitNames, attributes?: SplitIO.Attributes, _clientAttributes?: SplitIO.Attributes): import("@splitsoftware/splitio/types/splitio").TreatmentsWithConfig;
export {};
