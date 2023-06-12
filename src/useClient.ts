import React from 'react';
import SplitContext from './SplitContext';
import { ERROR_UC_NO_USECONTEXT } from './constants';
import { getSplitSharedClient, checkHooks, initAttributes } from './utils';

/**
 * 'useClient' is a custom hook that returns a client from the Split context.
 * It uses the 'useContext' hook to access the context, which is updated by
 * SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Client instance, or null if used outside the scope of SplitFactory
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
const useClient = (key?: SplitIO.SplitKey, trafficType?: string, attributes?: SplitIO.Attributes): SplitIO.IBrowserClient | null => {
  if (!checkHooks(ERROR_UC_NO_USECONTEXT)) return null;

  let { factory, client } = React.useContext(SplitContext);
  if (key && factory) {
    client = getSplitSharedClient(factory, key, trafficType, attributes);
  }
  if (client) initAttributes(client, attributes);
  return client;
};

export default useClient;
