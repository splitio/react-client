import React from 'react';

import { ISplitFactoryProviderProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, getSplitClient, getStatus } from './utils';
import { SplitContext } from './SplitContext';

/**
 * SplitFactoryProvider will initialize the Split SDK and its main client when `config` prop is provided or updated, listen for its events in order to update the Split Context,
 * and automatically destroy the SDK (shutdown and release resources) when it is unmounted or `config` prop updated. SplitFactoryProvider must wrap other library components and
 * functions since they access the Split Context and its properties (factory, client, isReady, etc).
 *
 * NOTE: Either pass a `factory` instance or a `config` object as props. If both props are passed, the `config` prop will be ignored.
 * Pass the same reference to the `config` or `factory` object rather than a new instance on each render, to avoid unnecessary props changes and SDK reinitializations.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038825091-React-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export function SplitFactoryProvider(props: ISplitFactoryProviderProps) {
  const { config, factory: propFactory } = props;

  const factory = React.useMemo(() => {
    return propFactory || (config ? getSplitFactory(config) : undefined);
  }, [config, propFactory]);

  // Effect to initialize and destroy the factory
  React.useEffect(() => {
    if (propFactory) {
      if (config) console.log(WARN_SF_CONFIG_AND_FACTORY);
      return;
    }

    if (config) {
      const factory = getSplitFactory(config);
      factory.init && factory.init();

      return () => {
        destroySplitFactory(factory);
      }
    }
  }, [config, propFactory]);

  return (
    <SplitContext.Provider value={{ factory }} >
      {props.children}
    </SplitContext.Provider>
  );
}
