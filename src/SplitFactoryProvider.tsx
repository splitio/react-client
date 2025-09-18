import * as React from 'react';

import { ISplitFactoryProviderProps } from './types';
import { VERSION, WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { getSplitClient, getStatus, initAttributes } from './utils';
import { SplitContext } from './SplitContext';
import { SplitFactory } from '@splitsoftware/splitio/client';

/**
 * Implementation rationale:
 * - Follows React rules: pure components & hooks, with side effects managed in `useEffect`.
 * - The `factory` and `client` properties in the context are available from the initial render, rather than being set lazily in a `useEffect`, so that:
 *   - Hooks retrieve the correct values from the start; for example, `useTrack` accesses the client's `track` method rather than a no-op function (related to https://github.com/splitio/react-client/issues/198).
 *   - Hooks can support Suspense and Server components where `useEffect` is not called (related to https://github.com/splitio/react-client/issues/192).
 *   - Re-renders are avoided for child components that do not depend on the factory being ready (e.g., tracking events, updating attributes, or managing consent).
 * - `SplitFactoryProvider` updates the context only when props change (`config` or `factory`) but not the state (e.g., client status), preventing unnecessary updates to child components and allowing them to control when to update independently.
 * - For these reasons, and to reduce component tree depth, `SplitFactoryProvider` no longer wraps the child component in a `SplitClient` component and thus does not accept a child as a function.
 */

/**
 * The SplitFactoryProvider is the top level component that provides the Split SDK factory to all child components via the Split Context.
 * It accepts either an SDK `factory` instance or a `config` object as props to initialize a new SDK factory.
 *
 * NOTE: Either pass a `factory` instance or a `config` object as props. If both props are passed, the `config` prop will be ignored.
 * Pass the same reference to the `config` or `factory` object rather than a new instance on each render, to avoid unnecessary props changes and SDK re-initializations.
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/react-sdk/#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export function SplitFactoryProvider(props: ISplitFactoryProviderProps) {
  const {
    config, factory: propFactory, attributes,
    updateOnSdkReady = true, updateOnSdkReadyFromCache = true, updateOnSdkTimedout = true, updateOnSdkUpdate = true
  } = props;

  const factory = React.useMemo<undefined | SplitIO.IBrowserSDK & { init?: () => void }>(() => {
    return propFactory ?
      propFactory :
      config ?
        // @ts-expect-error. 2nd param is not part of type definitions. Used to overwrite the SDK version and enable lazy init
        SplitFactory(config, (modules) => {
          modules.settings.version = VERSION;
          modules.lazyInit = true;
        }) :
        undefined;
  }, [config, propFactory]);

  const client = factory ? getSplitClient(factory) : undefined;

  initAttributes(client, attributes);

  // Effect to initialize and destroy the factory when config is provided
  React.useEffect(() => {
    if (propFactory) {
      if (config) console.log(WARN_SF_CONFIG_AND_FACTORY);
      return;
    }

    if (factory) {
      factory.init && factory.init();

      return () => {
        factory.destroy();
      }
    }
  }, [config, propFactory, factory]);

  return (
    <SplitContext.Provider value={{
      factory, client, ...getStatus(client),
      updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate
    }} >
      {props.children}
    </SplitContext.Provider>
  );
}
