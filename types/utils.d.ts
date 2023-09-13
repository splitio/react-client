import { ISplitStatus } from './types';
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
    lastUpdate: number;
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
export declare function getStatus(client: SplitIO.IBrowserClient | null): ISplitStatus;
export declare function validateFeatureFlags(maybeFeatureFlags: unknown, listName?: string): false | string[];
/**
 * Manage client attributes binding
 */
export declare function initAttributes(client: SplitIO.IBrowserClient | null, attributes?: SplitIO.Attributes): void;
