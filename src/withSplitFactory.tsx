import React from 'react';
import { ISplitFactoryChildProps } from './types';
import { SplitFactory } from './SplitFactory';

/**
 * High-Order Component for SplitFactory.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitFactory (see ISplitFactoryChildProps).
 *
 * @param config Config object used to instantiate a Split factory
 * @param factory Split factory instance to use instead of creating a new one with the config object.
 *
 * @deprecated Use `SplitFactoryProvider` instead.
 * `SplitFactoryProvider` is a drop-in replacement of `SplitFactory` that properly handles side effects (factory creation and destruction) within the React component lifecycle, avoiding issues with factory recreation and memory leaks.
 * Note: There is a subtle breaking change in `SplitFactoryProvider`. When using the `config` prop, `factory` and `client` properties in the context are `null` in the first render, until the context is updated when the factory is ready. This differs from the previous behavior where `factory` and `client` were immediately available.
 */
export function withSplitFactory(config?: SplitIO.IBrowserSettings, factory?: SplitIO.IBrowserSDK, attributes?: SplitIO.Attributes) {

  return function withSplitFactoryHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitFactoryChildProps>,
    updateOnSdkUpdate = false,
    updateOnSdkTimedout = false,
    updateOnSdkReady = true,
    updateOnSdkReadyFromCache = true,
  ) {

    return function wrapper(props: OuterProps) {
      return (
        <SplitFactory
          config={config}
          factory={factory}
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
        </SplitFactory>
      );
    };
  };
}
