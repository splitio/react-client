import React from 'react';
import { SplitContext } from './SplitContext';
import { getSplitClient, initAttributes, IClientWithContext, getStatus } from './utils';
import { ISplitContextValues, IUpdateProps } from './types';

export const DEFAULT_UPDATE_OPTIONS = {
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
export function useSplitClient(key?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes, options?: IUpdateProps): ISplitContextValues {
  const {
    updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate
  } = { ...DEFAULT_UPDATE_OPTIONS, ...options };

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

    const update = () => setLastUpdate(client.lastUpdate);

    // Subscribe to SDK events
    const status = getStatus(client);
    if (!status.isReady && updateOnSdkReady) client.once(client.Event.SDK_READY, update);
    if (!status.isReadyFromCache && updateOnSdkReadyFromCache) client.once(client.Event.SDK_READY_FROM_CACHE, update);
    if (!status.hasTimedout && !status.isReady && updateOnSdkTimedout) client.once(client.Event.SDK_READY_TIMED_OUT, update);
    if (updateOnSdkUpdate) client.on(client.Event.SDK_UPDATE, update);

    return () => {
      // Unsubscribe from events
      client.off(client.Event.SDK_READY, update);
      client.off(client.Event.SDK_READY_FROM_CACHE, update);
      client.off(client.Event.SDK_READY_TIMED_OUT, update);
      client.off(client.Event.SDK_UPDATE, update);
    }
  }, [client, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate]);

  return {
    factory, client, ...getStatus(client)
  };
}
