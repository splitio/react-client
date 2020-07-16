import React from 'react';
import { ISplitClientChildProps } from './types';
/**
 * High-Order Component for SplitClient.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitClient (see ISplitClientChildProps).
 *
 * @param splitKey The customer identifier.
 * @param trafficType Traffic type associated with the customer identifier. If no provided here or at the config object, it will be required on the client.track() calls.
 */
declare function withSplitClient(splitKey: SplitIO.SplitKey, trafficType?: string): <OuterProps>(WrappedComponent: React.ComponentType<OuterProps & ISplitClientChildProps>, updateOnSdkUpdate?: boolean, updateOnSdkTimedout?: boolean, updateOnSdkReady?: boolean, updateOnSdkReadyFromCache?: boolean) => (props: OuterProps) => JSX.Element;
export default withSplitClient;
