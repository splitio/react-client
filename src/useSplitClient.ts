import React from 'react';
import { useSplitContext } from './SplitContext';
import { getSplitClient, initAttributes, IClientWithContext, getStatus } from './utils';
import { ISplitContextValues, IUseSplitClientOptions } from './types';

export const DEFAULT_UPDATE_OPTIONS = {
  updateOnSdkUpdate: true,
  updateOnSdkTimedout: true,
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
 * const { factory, client, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitClient({ splitKey: 'user_id' });
 * ```
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function useSplitClient(options?: IUseSplitClientOptions): ISplitContextValues {
  const {
    updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate, splitKey, attributes
  } = { ...DEFAULT_UPDATE_OPTIONS, ...options };

  const context = useSplitContext();
  const { client: contextClient, factory } = context;

  // @TODO Move `getSplitClient` side effects
  // @TODO Once `SplitClient` is removed, which updates the context, simplify next line as `const client = factory ? getSplitClient(factory, splitKey) : undefined;`
  const client = factory && splitKey ? getSplitClient(factory, splitKey) : contextClient as IClientWithContext;

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
