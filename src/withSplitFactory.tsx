import React from 'react';
import { ISplitFactoryChildProps } from './types';
import { SplitFactoryProvider } from './SplitFactoryProvider';
import { SplitClient } from './SplitClient';

/**
 * High-Order Component for `SplitFactoryProvider`.
 * The wrapped component receives all the props of the container,
 * along with the passed props from the Split context (see `ISplitFactoryChildProps`).
 *
 * @param config - Config object used to instantiate a Split factory
 * @param factory - Split factory instance to use instead of creating a new one with the config object.
 * @param attributes - An object of type Attributes used to evaluate the feature flags.
 *
 * @deprecated `withSplitFactory` will be removed in a future major release. We recommend replacing it with the `SplitFactoryProvider` component.
 */
export function withSplitFactory(config?: SplitIO.IBrowserSettings, factory?: SplitIO.IBrowserSDK, attributes?: SplitIO.Attributes) {

  return function withSplitFactoryHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitFactoryChildProps>,
    updateOnSdkUpdate?: boolean,
    updateOnSdkTimedout?: boolean,
    updateOnSdkReady?: boolean,
    updateOnSdkReadyFromCache?: boolean,
  ) {

    return function wrapper(props: OuterProps) {
      return (
        <SplitFactoryProvider
          config={config}
          factory={factory}>
          <SplitClient
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
        </SplitFactoryProvider>
      );
    };
  };
}
