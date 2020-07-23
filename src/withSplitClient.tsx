import React from 'react';
import { ISplitClientChildProps } from './types';
import SplitClient from './SplitClient';

/**
 * High-Order Component for SplitClient.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitClient (see ISplitClientChildProps).
 *
 * @param splitKey The customer identifier.
 * @param trafficType Traffic type associated with the customer identifier. If no provided here or at the config object, it will be required on the client.track() calls.
 */
function withSplitClient(splitKey: SplitIO.SplitKey, trafficType?: string) {

  return function withSplitClientHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitClientChildProps>,
    updateOnSdkUpdate: boolean = false,
    updateOnSdkTimedout: boolean = false,
    updateOnSdkReady: boolean = true,
    updateOnSdkReadyFromCache: boolean = true,
  ) {

    return (props: OuterProps) => {
      return (
        <SplitClient
          splitKey={splitKey}
          trafficType={trafficType}
          updateOnSdkUpdate={updateOnSdkUpdate}
          updateOnSdkTimedout={updateOnSdkTimedout}
          updateOnSdkReady={updateOnSdkReady}
          updateOnSdkReadyFromCache={updateOnSdkReadyFromCache} >
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

export default withSplitClient;
