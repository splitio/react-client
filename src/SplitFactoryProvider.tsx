import React from 'react';

import { SplitComponent } from './SplitClient';
import { ISplitFactoryProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, IFactoryWithClients, getSplitClient, getStatus } from './utils';
import { DEFAULT_UPDATE_OPTIONS } from './useSplitClient';

/**
 * SplitFactoryProvider will initialize the Split SDK and its main client when it is mounted, listen for its events in order to update the Split Context,
 * and automatically shutdown and release resources when it is unmounted. SplitFactoryProvider must wrap other library components and functions
 * since they access the Split Context and its elements (factory, clients, etc).
 *
 * NOTE: Either pass a factory instance or a config object. If both are passed, the config object will be ignored.
 * Pass a reference to the config or factory object rather than a new instance on each render, to avoid unnecessary props changes and SDK reinitializations.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038825091-React-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export function SplitFactoryProvider(props: ISplitFactoryProps) {
  let {
    config, factory: propFactory,
    updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate
  } = { ...DEFAULT_UPDATE_OPTIONS, ...props };

  if (config && propFactory) {
    console.log(WARN_SF_CONFIG_AND_FACTORY);
    config = undefined;
  }

  const [stateFactory, setStateFactory] = React.useState(propFactory || null);
  const factory = propFactory || stateFactory;
  const client = factory ? getSplitClient(factory) : null;

  React.useEffect(() => {
    if (config) {
      const factory = getSplitFactory(config);
      const client = getSplitClient(factory);
      const status = getStatus(client);

      // Update state and unsubscribe from events when first event is emitted
      const update = () => {
        client.off(client.Event.SDK_READY, update);
        client.off(client.Event.SDK_READY_FROM_CACHE, update);
        client.off(client.Event.SDK_READY_TIMED_OUT, update);
        client.off(client.Event.SDK_UPDATE, update);

        setStateFactory(factory);
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

      return () => {
        destroySplitFactory(factory as IFactoryWithClients);
      }
    }
  }, [config, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate]);

  return (
    <SplitComponent {...props} factory={factory} client={client} />
  );
}
