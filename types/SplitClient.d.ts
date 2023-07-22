import React from 'react';
import { ISplitClientProps, ISplitContextValues, IUpdateProps } from './types';
/**
 * Common component used to handle the status and events of a Split client passed as prop.
 * Reused by both SplitFactory (main client) and SplitClient (shared client) components.
 */
export declare class SplitComponent extends React.Component<IUpdateProps & {
    factory: SplitIO.IBrowserSDK | null;
    client: SplitIO.IBrowserClient | null;
    attributes?: SplitIO.Attributes;
    children: any;
}, ISplitContextValues> {
    static defaultProps: {
        updateOnSdkUpdate: boolean;
        updateOnSdkTimedout: boolean;
        updateOnSdkReady: boolean;
        updateOnSdkReadyFromCache: boolean;
        children: null;
        factory: null;
        client: null;
    };
    static getDerivedStateFromProps(props: ISplitClientProps & {
        factory: SplitIO.IBrowserSDK | null;
        client: SplitIO.IBrowserClient | null;
    }, state: ISplitContextValues): {
        isReady: boolean;
        isReadyFromCache: boolean;
        isTimedout: boolean;
        hasTimedout: boolean;
        isDestroyed: boolean;
        lastUpdate: number;
        client: import("@splitsoftware/splitio/types/splitio").IBrowserClient | null;
        factory: import("@splitsoftware/splitio/types/splitio").IBrowserSDK | null;
    } | null;
    readonly state: Readonly<ISplitContextValues>;
    constructor(props: ISplitClientProps & {
        factory: SplitIO.IBrowserSDK | null;
        client: SplitIO.IBrowserClient | null;
    });
    subscribeToEvents(client: SplitIO.IBrowserClient | null): void;
    unsubscribeFromEvents(client: SplitIO.IBrowserClient | null): void;
    setReady: () => void;
    setReadyFromCache: () => void;
    setTimedout: () => void;
    setUpdate: () => void;
    componentDidMount(): void;
    componentDidUpdate(prevProps: ISplitClientProps & {
        factory: SplitIO.IBrowserSDK | null;
        client: SplitIO.IBrowserClient | null;
    }): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
/**
 * SplitClient will initialize a new SDK client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * Unlike SplitFactory, the underlying SDK client can be changed during the component lifecycle
 * if the component is updated with a different splitKey or trafficType prop. Since the client can change,
 * its release is not handled by SplitClient but by its container SplitFactory component.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export declare function SplitClient(props: ISplitClientProps): JSX.Element;
