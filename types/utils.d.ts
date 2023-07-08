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
    clientInstances: Set<IClientWithContext>;
    config: SplitIO.IBrowserSettings;
}
export declare const __factories: Map<SplitIO.IBrowserSettings, IFactoryWithClients>;
export declare function getSplitFactory(config: SplitIO.IBrowserSettings): IFactoryWithClients;
export declare function getSplitClient(factory: SplitIO.IBrowserSDK, key?: SplitIO.SplitKey, trafficType?: string): IClientWithContext;
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
 * Checks if React.useContext is available, and logs given message if not
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
