import React from 'react';
import { ISplitFactoryProps } from './types';
/**
 * SplitFactory will initialize the Split SDK and its main client, listen for its events in order to update the Split Context,
 * and automatically shutdown and release resources when it is unmounted. SplitFactory must wrap other components and functions
 * from this library, since they access the Split Context and its elements (factory, clients, etc).
 *
 * The underlying SDK factory and client is set on the constructor, and cannot be changed during the component lifecycle,
 * even if the component is updated with a different config or factory prop.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK}
 */
export declare class SplitFactory extends React.Component<ISplitFactoryProps, {
    factory: SplitIO.IBrowserSDK | null;
    client: SplitIO.IBrowserClient | null;
}> {
    static defaultProps: ISplitFactoryProps;
    readonly state: Readonly<{
        factory: SplitIO.IBrowserSDK | null;
        client: SplitIO.IBrowserClient | null;
    }>;
    readonly isFactoryExternal: boolean;
    constructor(props: ISplitFactoryProps);
    componentWillUnmount(): void;
    render(): JSX.Element;
}
