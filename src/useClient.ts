import React from 'react';
import SplitContext from './SplitContext';
import { getSplitSharedClient, checkHooks } from './utils';
import { ERROR_UC_NO_USECONTEXT } from './constants';

/**
 * 'useClient' is a custom hook that returns a client from the Split context.
 * It uses the 'useContext' hook to access the context, which is updated by
 * SplitFactory and SplitClient components in the hierarchy of components.
 *
 * @return A Split Client instance, or null if used outside the scope of SplitFactory
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
const useClient = (key?: SplitIO.SplitKey, trafficType?: string): SplitIO.IClient | null => {
  if (!checkHooks(ERROR_UC_NO_USECONTEXT)) return null;
  const { factory, client } = React.useContext(SplitContext);
  if (key) {
    return factory ? getSplitSharedClient(factory, key, trafficType) : null;
  }
  return client;
};

export default useClient;
