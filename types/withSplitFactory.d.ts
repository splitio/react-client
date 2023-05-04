import React from 'react';
import { ISplitFactoryChildProps } from './types';
/**
 * High-Order Component for SplitFactory.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitFactory (see ISplitFactoryChildProps).
 *
 * @param config Config object used to instantiate a Split factory
 * @param factory Split factory instance to use instead of creating a new one with the config object.
 */
export declare function withSplitFactory(config?: SplitIO.IBrowserSettings, factory?: SplitIO.IBrowserSDK, attributes?: SplitIO.Attributes): <OuterProps>(WrappedComponent: React.ComponentType<OuterProps & ISplitFactoryChildProps>, updateOnSdkUpdate?: boolean, updateOnSdkTimedout?: boolean, updateOnSdkReady?: boolean, updateOnSdkReadyFromCache?: boolean) => (props: OuterProps) => JSX.Element;
