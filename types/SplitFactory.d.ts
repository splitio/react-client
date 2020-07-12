import React from 'react';
import { ISplitFactoryProps } from './types';
/**
 * SplitFactory will initialize the Split SDK and listen for its events in order to update the Split Context.
 * SplitFactory must wrap other components and functions from this library, since they access the Split Context
 * and its elements (factory, clients, etc).
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK}
 */
declare class SplitFactory extends React.Component<ISplitFactoryProps, {
    factory: SplitIO.ISDK | null;
    client: SplitIO.IClient | null;
}> {
    static defaultProps: ISplitFactoryProps;
    readonly state: Readonly<{
        factory: SplitIO.ISDK | null;
        client: SplitIO.IClient | null;
    }>;
    readonly isFactoryExternal: boolean;
    constructor(props: ISplitFactoryProps);
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export default SplitFactory;
