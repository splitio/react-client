import React from 'react';

import { SplitClient } from './SplitClient';
import { ISplitFactoryProps } from './types';
import { ERROR_SF_NO_CONFIG_AND_FACTORY, WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { IFactoryWithClients, destroySplitFactory, getSplitClient, getSplitFactory, getStatus } from './utils';
import { SplitContext } from './SplitContext';

/**
 * SplitFactory will initialize the Split SDK and its main client, listen for its events in order to update the Split Context,
 * and automatically shutdown and release resources when it is unmounted. SplitFactory must wrap other components and functions
 * from this library, since they access the Split Context and its elements (factory, clients, etc).
 *
 * The underlying SDK factory and client is set on the constructor, and cannot be changed during the component lifecycle,
 * even if the component is updated with a different config or factory prop.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK}
 */
export function SplitFactory(props: ISplitFactoryProps) {
  const { config, factory: propFactory, children } = props;

  // Log warning and error
  if (!config && !propFactory) {
    console.error(ERROR_SF_NO_CONFIG_AND_FACTORY);
  }
  if (config && propFactory) {
    console.log(WARN_SF_CONFIG_AND_FACTORY);
  }

  const [isFactoryExternal] = React.useState(propFactory ? true : false);
  // Instantiate factory
  // We use an idempotent variant of the Split factory builder (i.e., given the same config, it returns the same already
  // created instance), since React component constructors is part of render-phase and can be invoked multiple times.
  const [factory] = React.useState(() => propFactory ? propFactory : config ? getSplitFactory(config) : null);
  const [client] = React.useState(() => factory ? getSplitClient(factory) : null);

  React.useEffect(() => {
    return () => {
      if (!isFactoryExternal && factory) {
        destroySplitFactory(factory as IFactoryWithClients);
      }
    }
  });

  return (
    <SplitContext.Provider value={{
      factory, client, ...getStatus(client)
    }} >
      <SplitClient {...props}
        splitKey={(factory ? factory.settings.core.key : undefined) as any}
        trafficType={factory ? factory.settings.core.trafficType : undefined}
      >
        {children}
      </SplitClient>
    </SplitContext.Provider>
  );
}
