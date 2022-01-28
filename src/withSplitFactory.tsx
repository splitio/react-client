import React from 'react';
import { ISplitFactoryChildProps } from './types';
import SplitFactory from './SplitFactory';

/**
 * High-Order Component for SplitFactory.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitFactory (see ISplitFactoryChildProps).
 *
 * @param config Config object used to instantiate a Split factory
 * @param factory Split factory instance to use instead of creating a new one with the config object.
 */
export function withSplitFactory(config?: SplitIO.IBrowserSettings, factory?: SplitIO.IBrowserSDK) {

  return function withSplitFactoryHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitFactoryChildProps>,
    updateOnSdkUpdate: boolean = false,
    updateOnSdkTimedout: boolean = false,
    updateOnSdkReady: boolean = true,
    updateOnSdkReadyFromCache: boolean = true,
  ) {

    return (props: OuterProps) => {
      return (
        <SplitFactory
          config={config}
          factory={factory}
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
        </SplitFactory>
      );
    };
  };
}

export default withSplitFactory;
