import React from 'react';
import SplitContext, { ISplitContextValues, INITIAL_CONTEXT } from './SplitContext';
import { ERROR_UC_NO_USECONTEXT } from './constants';
import { getSplitSharedClient, checkHooks, initAttributes, IClientWithContext } from './utils';

/**
 * 'useClientAndContext' is a hook that returns an Split Context object with the client and its status corresponding to the provided key and trafficType.
 * It uses the 'useContext' hook to access the context, which is updated by SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Context object
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function useClientAndContext(key?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): ISplitContextValues {
  if (!checkHooks(ERROR_UC_NO_USECONTEXT)) return INITIAL_CONTEXT;

  const context = React.useContext(SplitContext); // eslint-disable-next-line prefer-const
  let { factory, client } = context;
  if (key && factory) {
    client = getSplitSharedClient(factory, key, trafficType, attributes);
  }
  if (client) initAttributes(client, attributes);
  return client === context.client ? context : {
    ...context, client, ...(client as IClientWithContext).__getStatus()
  };
}
