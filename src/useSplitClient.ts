import React from 'react';
import { SplitContext } from './SplitContext';
import { getSplitClient, initAttributes, IClientWithContext, getStatus } from './utils';
import { ISplitContextValues, IUpdateProps } from './types';

const DEFAULT_OPTIONS = {
  updateOnSdkUpdate: false,
  updateOnSdkTimedout: false,
  updateOnSdkReady: true,
  updateOnSdkReadyFromCache: true,
};

/**
 * 'useSplitClient' is a hook that returns an Split Context object with the client and its status corresponding to the provided key and trafficType.
 * It uses the 'useContext' hook to access the context, which is updated by SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Context object
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function useSplitClient(key?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes, options: IUpdateProps = {}): ISplitContextValues {
  options = { ...DEFAULT_OPTIONS, ...options };

  const context = React.useContext(SplitContext);
  const { client: contextClient, factory } = context;

  let client = contextClient as IClientWithContext;
  if (key && factory) {
    client = getSplitClient(factory, key, trafficType);
  }
  initAttributes(client, attributes);

  const [, setLastUpdate] = React.useState(client ? client.lastUpdate : 0);

  // Handle client events
  React.useEffect(() => {
    if (!client) return;

    const setReady = () => {
      if (options.updateOnSdkReady) setLastUpdate(client.lastUpdate);
    }

    const setReadyFromCache = () => {
      if (options.updateOnSdkReadyFromCache) setLastUpdate(client.lastUpdate);
    }

    const setTimedout = () => {
      if (options.updateOnSdkTimedout) setLastUpdate(client.lastUpdate);
    }

    const setUpdate = () => {
      if (options.updateOnSdkUpdate) setLastUpdate(client.lastUpdate);
    }

    // Subscribe to SDK events
    const status = getStatus(client);
    if (!status.isReady) client.once(client.Event.SDK_READY, setReady);
    if (!status.isReadyFromCache) client.once(client.Event.SDK_READY_FROM_CACHE, setReadyFromCache);
    if (!status.hasTimedout && !status.isReady) client.once(client.Event.SDK_READY_TIMED_OUT, setTimedout);
    client.on(client.Event.SDK_UPDATE, setUpdate);

    return () => {
      // Unsubscribe from events
      client.off(client.Event.SDK_READY, setReady);
      client.off(client.Event.SDK_READY_FROM_CACHE, setReadyFromCache);
      client.off(client.Event.SDK_READY_TIMED_OUT, setTimedout);
      client.off(client.Event.SDK_UPDATE, setUpdate);
    }
  }, [client]);

  return {
    factory, client, ...getStatus(client)
  };
}
