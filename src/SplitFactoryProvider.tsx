import React from 'react';

import { SplitComponent } from './SplitClient';
import { ISplitFactoryProviderProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, IFactoryWithClients, getSplitClient, getStatus } from './utils';
import { DEFAULT_UPDATE_OPTIONS } from './useSplitClient';

/**
 * SplitFactoryProvider will initialize the Split SDK and its main client when `config` prop is provided or updated, listen for its events in order to update the Split Context,
 * and automatically destroy the SDK (shutdown and release resources) when it is unmounted or `config` prop updated. SplitFactoryProvider must wrap other library components and
 * functions since they access the Split Context and its properties (factory, client, isReady, etc).
 *
 * NOTE: Either pass a `factory` instance or a `config` object as props. If both props are passed, the `config` prop will be ignored.
 * Pass the same reference to the `config` or `factory` object rather than a new instance on each render, to avoid unnecessary props changes and SDK reinitializations.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038825091-React-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export function SplitFactoryProvider(props: ISplitFactoryProviderProps) {
  let {
    config, factory: propFactory,
    updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate
  } = { ...DEFAULT_UPDATE_OPTIONS, ...props };

  if (config && propFactory) {
    console.log(WARN_SF_CONFIG_AND_FACTORY);
    config = undefined;
  }

  const [configFactory, setConfigFactory] = React.useState<IFactoryWithClients | null>(null);
  const factory = React.useMemo(() => {
    return propFactory || (configFactory && config === configFactory.config ? configFactory : null);
  }, [config, propFactory, configFactory]);
  const client = factory ? getSplitClient(factory) : null;

  // Effect to initialize and destroy the factory
  React.useEffect(() => {
    if (config) {
      const factory = getSplitFactory(config);

      return () => {
        destroySplitFactory(factory);
      }
    }
  }, [config]);

  // Effect to subscribe/unsubscribe to events
  React.useEffect(() => {
    const factory = config && getSplitFactory(config);
    if (factory) {
      const client = getSplitClient(factory);
      const status = getStatus(client);

      // Unsubscribe from events and update state when first event is emitted
      const update = () => { // eslint-disable-next-line no-use-before-define
        unsubscribe();
        setConfigFactory(factory);
      }

      const unsubscribe = () => {
        client.off(client.Event.SDK_READY, update);
        client.off(client.Event.SDK_READY_FROM_CACHE, update);
        client.off(client.Event.SDK_READY_TIMED_OUT, update);
        client.off(client.Event.SDK_UPDATE, update);
      }

      if (updateOnSdkReady) {
        if (status.isReady) update();
        else client.once(client.Event.SDK_READY, update);
      }
      if (updateOnSdkReadyFromCache) {
        if (status.isReadyFromCache) update();
        else client.once(client.Event.SDK_READY_FROM_CACHE, update);
      }
      if (updateOnSdkTimedout) {
        if (status.hasTimedout) update();
        else client.once(client.Event.SDK_READY_TIMED_OUT, update);
      }
      if (updateOnSdkUpdate) client.on(client.Event.SDK_UPDATE, update);

      return unsubscribe;
    }
  }, [config, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate]);

  return (
    <SplitComponent {...props} factory={factory} client={client} />
  );
}
