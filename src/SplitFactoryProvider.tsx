import React from 'react';

import { ISplitFactoryProviderProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory } from './utils';
import { SplitContext } from './SplitContext';

/**
 * The SplitFactoryProvider is the top level component that provides the Split SDK factory to all child components via the Split Context.
 * It accepts either an SDK `factory` instance or a `config` object as props to initialize a new SDK factory.
 *
 * NOTE: Either pass a `factory` instance or a `config` object as props. If both props are passed, the `config` prop will be ignored.
 * Pass the same reference to the `config` or `factory` object rather than a new instance on each render, to avoid unnecessary props changes and SDK re-initializations.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038825091-React-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export function SplitFactoryProvider(props: ISplitFactoryProviderProps) {
  const { config, factory: propFactory } = props;

  const factory = React.useMemo(() => {
    return propFactory || (config ? getSplitFactory(config) : undefined);
  }, [config, propFactory]);

  // Effect to initialize and destroy the factory when config is provided
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
