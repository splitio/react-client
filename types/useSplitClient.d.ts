import { ISplitContextValues, IUseSplitClientOptions } from './types';
export declare const DEFAULT_UPDATE_OPTIONS: {
    updateOnSdkUpdate: boolean;
    updateOnSdkTimedout: boolean;
    updateOnSdkReady: boolean;
    updateOnSdkReadyFromCache: boolean;
};
/**
 * 'useSplitClient' is a hook that returns an Split Context object with the client and its status corresponding to the provided key and trafficType.
 * It uses the 'useContext' hook to access the context, which is updated by SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Context object
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export declare function useSplitClient(options?: IUseSplitClientOptions): ISplitContextValues;
