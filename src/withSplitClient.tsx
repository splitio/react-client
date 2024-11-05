import React from 'react';
import { ISplitClientChildProps } from './types';
import { SplitClient } from './SplitClient';

/**
 * High-Order Component for SplitClient.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitClient (see ISplitClientChildProps).
 *
 * @param splitKey - The customer identifier.
 * @param attributes - An object of type Attributes used to evaluate the feature flags.
 *
 * @deprecated `withSplitClient` will be removed in a future major release. We recommend replacing it with the `useSplitClient` hook.
 */
export function withSplitClient(splitKey: SplitIO.SplitKey, attributes?: SplitIO.Attributes) {

  return function withSplitClientHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitClientChildProps>,
    updateOnSdkUpdate = true,
    updateOnSdkTimedout = true,
    updateOnSdkReady = true,
    updateOnSdkReadyFromCache = true,
  ) {

    return function wrapper(props: OuterProps) {
      return (
        <SplitClient
          splitKey={splitKey}
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
