import React from 'react';
import { ISplitClientChildProps } from './types';
import { SplitClient } from './SplitClient';

/**
 * High-Order Component for SplitClient.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitClient (see ISplitClientChildProps).
 *
 * @param splitKey The customer identifier.
 * @param trafficType Traffic type associated with the customer identifier. If no provided here or at the config object, it will be required on the client.track() calls.
 */
export function withSplitClient(splitKey: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes) {

  return function withSplitClientHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitClientChildProps>,
    updateOnSdkUpdate = false,
    updateOnSdkTimedout = false,
    updateOnSdkReady = true,
    updateOnSdkReadyFromCache = true,
  ) {

    return function wrapper(props: OuterProps) {
      return (
        <SplitClient
          splitKey={splitKey}
          trafficType={trafficType}
          updateOnSdkUpdate={updateOnSdkUpdate}
          updateOnSdkTimedout={updateOnSdkTimedout}
          updateOnSdkReady={updateOnSdkReady}
          updateOnSdkReadyFromCache={updateOnSdkReadyFromCache}
          attributes={attributes}>
          {(splitProps) => {
            return (
              <WrappedComponent
                {...props} {...splitProps} />
            );
          }}
        </SplitClient>
      );
    };
  };
}
