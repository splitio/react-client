/**
 * FactoryWithClientInstances interface.
 */
export interface IFactoryWithClients extends SplitIO.IBrowserSDK {
    sharedClientInstances: Set<IClientWithContext>;
    config: SplitIO.IBrowserSettings;
}
export declare const __factories: Map<SplitIO.IBrowserSettings, IFactoryWithClients>;
export declare function getSplitFactory(config: SplitIO.IBrowserSettings): IFactoryWithClients;
export declare function getSplitSharedClient(factory: SplitIO.IBrowserSDK, key: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): IClientWithContext;
export declare function destroySplitFactory(factory: IFactoryWithClients): Promise<void[]>;
/**
 * ClientWithContext interface.
 */
interface IClientWithContext extends SplitIO.IBrowserClient {
    __context: {
        constants: {
            READY: 'is_ready';
            READY_FROM_CACHE: 'is_ready_from_cache';
            HAS_TIMEDOUT: 'has_timedout';
            DESTROYED: 'is_destroyed';
        };
        get: (name: string, flagCheck: boolean) => boolean | undefined;
    };
}
export interface IClientStatus {
    isReady: boolean;
    isReadyFromCache: boolean;
    hasTimedout: boolean;
    isTimedout: boolean;
    isDestroyed: boolean;
}
export declare function getIsReady(client: SplitIO.IBrowserClient): boolean;
export declare function getIsReadyFromCache(client: SplitIO.IBrowserClient): boolean;
export declare function getHasTimedout(client: SplitIO.IBrowserClient): boolean;
export declare function getIsDestroyed(client: SplitIO.IBrowserClient): boolean;
export declare function getStatus(client: SplitIO.IBrowserClient | null): IClientStatus;
/**
 * Checks if React.useContext is available, and logs given message if not
 *
 * @param message
 * @returns boolean indicating if React.useContext is available
 */
export declare function checkHooks(message: string): boolean;
export declare function validateSplits(maybeSplits: unknown, listName?: string): false | string[];
export {};
