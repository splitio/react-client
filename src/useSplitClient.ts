import React from 'react';
import { SplitContext } from './SplitContext';
import { getSplitSharedClient, initAttributes, IClientWithContext } from './utils';
import { ISplitContextValues } from './types';

/**
 * 'useSplitClient' is a hook that returns an Split Context object with the client and its status corresponding to the provided key and trafficType.
 * It uses the 'useContext' hook to access the context, which is updated by SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Context object
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function useSplitClient(key?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): ISplitContextValues {
  const context = React.useContext(SplitContext);
  let { factory, client } = context;
  if (key && factory) {
    client = getSplitSharedClient(factory, key, trafficType);
  }
  initAttributes(client, attributes);
  return client === context.client ? context : {
    ...context, client, ...(client as IClientWithContext).__getStatus()
  };
}
