import React from 'react';
import { useSplitContext } from './SplitContext';
import { getSplitClient, initAttributes, getStatus } from './utils';
import { IUseSplitClientResult, IUseSplitClientOptions } from './types';

export const DEFAULT_UPDATE_OPTIONS = {
  updateOnSdkUpdate: false,
  updateOnSdkTimedout: false,
  updateOnSdkReady: true,
  updateOnSdkReadyFromCache: true,
};

/**
 * 'useSplitClient' is a hook that returns the Split Context object with the client and its status corresponding to the provided key.
 *
 * @param options - An options object with an optional `splitKey` to retrieve the client, optional `attributes` to configure the client, and update options to control on which SDK events the hook should update.
 * @returns A Split Context object merged with the client and its status.
 *
 * @example
 * ```js
 * const { client, isReady, isReadyFromCache, lastUpdate, ... } = useSplitClient({ splitKey: 'user_id' });
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function useSplitClient(options?: IUseSplitClientOptions): IUseSplitClientResult {
  const {
    updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate, splitKey, attributes
  } = { ...DEFAULT_UPDATE_OPTIONS, ...options };

  const { factory } = useSplitContext();

  // @TODO `getSplitClient` starts client sync. Move side effects to useEffect
  const client = factory ? getSplitClient(factory, splitKey) : undefined;

  initAttributes(client, attributes);

  const status = getStatus(client);
  const [, setLastUpdate] = React.useState(status.lastUpdate);

  // Handle client events
  React.useEffect(() => {
    if (!client) return;

    const update = () => setLastUpdate(client.__getStatus().lastUpdate);

    // Clients are created on the hook's call, so the status may have changed
    const statusOnEffect = getStatus(client);

    // Subscribe to SDK events
    if (updateOnSdkReady) {
      if (!statusOnEffect.isReady) client.once(client.Event.SDK_READY, update);
      else if (!status.isReady) update();
    }
    if (updateOnSdkReadyFromCache) {
      if (!statusOnEffect.isReadyFromCache) client.once(client.Event.SDK_READY_FROM_CACHE, update);
      else if (!status.isReadyFromCache) update();
    }
    if (updateOnSdkTimedout) {
      if (!statusOnEffect.hasTimedout) client.once(client.Event.SDK_READY_TIMED_OUT, update);
      else if (!status.hasTimedout) update();
    }
    if (updateOnSdkUpdate) client.on(client.Event.SDK_UPDATE, update);

    return () => {
      // Unsubscribe from events
      client.off(client.Event.SDK_READY, update);
      client.off(client.Event.SDK_READY_FROM_CACHE, update);
      client.off(client.Event.SDK_READY_TIMED_OUT, update);
      client.off(client.Event.SDK_UPDATE, update);
    }
  }, [client, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate, status]);

  return {
    factory, client, ...status
  };
}
