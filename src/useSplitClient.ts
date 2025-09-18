import * as React from 'react';
import { useSplitContext } from './SplitContext';
import { getSplitClient, initAttributes, getStatus } from './utils';
import { ISplitContextValues, IUseSplitClientOptions } from './types';

/**
 * `useSplitClient` is a hook that returns an Split Context object with the client and its status corresponding to the provided key.
 *
 * @param options - An options object with an optional `splitKey` to retrieve the client, optional `attributes` to configure the client, and update options to control on which SDK events the hook should update.
 * @returns A Split Context object merged with the client and its status.
 *
 * @example
 * ```js
 * const { factory, client, isReady, isReadyFromCache, hasTimedout, lastUpdate } = useSplitClient({ splitKey: 'user_id' });
 * ```
 *
 * @see {@link https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/client-side-sdks/javascript-sdk/#advanced-instantiate-multiple-sdk-clients}
 */
export function useSplitClient(options: IUseSplitClientOptions = {}): ISplitContextValues {
  const context = useSplitContext();
  const { client: contextClient, factory } = context;
  const {
    splitKey, attributes,
    updateOnSdkReady = context.updateOnSdkReady,
    updateOnSdkReadyFromCache = context.updateOnSdkReadyFromCache,
    updateOnSdkTimedout = context.updateOnSdkTimedout,
    updateOnSdkUpdate = context.updateOnSdkUpdate
  } = options;

  // @TODO Move `getSplitClient` side effects and reduce the function cognitive complexity
  // @TODO Once `SplitClient` is removed, which updates the context, simplify next line as `const client = factory ? getSplitClient(factory, splitKey) : undefined;`
  const client = factory && splitKey ? getSplitClient(factory, splitKey) : contextClient;

  initAttributes(client, attributes);

  const [lastUpdate, setLastUpdate] = React.useState(0);
  // `getStatus` is not pure. Its result depends on `client` and `lastUpdate`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const status = React.useMemo(() => getStatus(client), [client, lastUpdate]);

  // Handle client events
  React.useEffect(() => {
    if (!client) return;

    const update = () => setLastUpdate(getStatus(client).lastUpdate);

    // Clients are created on the hook's call, so the status may have changed
    const statusOnEffect = getStatus(client);

    // Subscribe to SDK events
    if (updateOnSdkReady !== false) {
      if (!statusOnEffect.isReady) client.once(client.Event.SDK_READY, update);
      else if (!status.isReady) update();
    }
    if (updateOnSdkReadyFromCache !== false) {
      if (!statusOnEffect.isReadyFromCache) client.once(client.Event.SDK_READY_FROM_CACHE, update);
      else if (!status.isReadyFromCache) update();
    }
    if (updateOnSdkTimedout !== false) {
      if (!statusOnEffect.hasTimedout) {
        // Required to avoid error log for event already emitted
        if (!statusOnEffect.isReady) client.once(client.Event.SDK_READY_TIMED_OUT, update);
      } else {
        if (!status.hasTimedout) update();
      }
    }
    if (updateOnSdkUpdate !== false) {
      client.on(client.Event.SDK_UPDATE, update);
      if (statusOnEffect.isReady && statusOnEffect.lastUpdate > status.lastUpdate) update();
    }

    return () => {
      // Unsubscribe from events
      client.off(client.Event.SDK_READY, update);
      client.off(client.Event.SDK_READY_FROM_CACHE, update);
      client.off(client.Event.SDK_READY_TIMED_OUT, update);
      client.off(client.Event.SDK_UPDATE, update);
    }
  }, [client, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate, status]);

  return {
    factory, client, ...status, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate
  };
}
