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
 * @deprecated Replace with the new `SplitFactoryProvider` component.
 * `SplitFactoryProvider` is a revised version of `SplitFactory` that properly handles SDK side effects (factory creation and destruction) within the React component lifecycle,
 * resolving memory leak issues in React development mode, strict mode and server-side rendering, and also ensuring that the SDK is updated if `config` or `factory` props change.
 *
 * Notable changes to consider when migrating:
 * - `SplitFactoryProvider` utilizes the React Hooks API, requiring React 16.8.0 or later, while `SplitFactory` is compatible with React 16.3.0 or later.
 * - When using the `config` prop with `SplitFactoryProvider`, `factory` and `client` properties in `SplitContext` are `null` in the first render, until
 * the context is updated when some event is emitted on the SDK main client (ready, ready from cache, timeout or update depending on the configuration
 * of the `updateOn<Event>` props of the component). This differs from the previous behavior where `factory` and `client` were immediately available.
 * - Updating the `config` prop in `SplitFactoryProvider` reinitializes the SDK with the new configuration, while `SplitFactory` does not reinitialize the SDK. It is recommended to
 * pass a reference to the configuration object (e.g., via a global variable, `useState`, or `useMemo`) rather than a new instance on each render, to avoid unnecessary reinitializations.
 * - Updating the `factory` prop in `SplitFactoryProvider` replaces the current SDK instance, unlike `SplitFactory` where it is ignored.
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
