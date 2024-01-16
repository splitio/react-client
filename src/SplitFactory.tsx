import React from 'react';

import { SplitComponent } from './SplitClient';
import { ISplitFactoryProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, IFactoryWithClients, getSplitClient } from './utils';
import { DEFAULT_UPDATE_OPTIONS } from './useSplitClient';

/**
 * SplitFactory will initialize the Split SDK and its main client, listen for its events in order to update the Split Context,
 * and automatically shutdown and release resources when it is unmounted. SplitFactory must wrap other components and functions
 * from this library, since they access the Split Context and its properties (factory, client, isReady, etc).
 *
 * The underlying SDK factory and client is set on the constructor, and cannot be changed during the component lifecycle,
 * even if the component is updated with a different config or factory prop.
 *
 * @deprecated Replace with the new `SplitFactoryProvider` component.
 * `SplitFactoryProvider` is a drop-in replacement that properly handles side effects (factory creation and destruction) within the React component lifecycle, avoiding issues with factory recreation and memory leaks.
 * Note: There is a subtle breaking change in `SplitFactoryProvider`. When using the `config` prop, `factory` and `client` properties in the context are `null` in the first render, until the context is updated when some event is emitted on
 * the SDK main client (ready, ready from cache, timeout or update depending on the configuration of the `updateOnXXX` props of the component). This differs from the previous behavior where `factory` and `client` were immediately available.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360038825091-React-SDK#2-instantiate-the-sdk-and-create-a-new-split-client}
 */
export class SplitFactory extends React.Component<ISplitFactoryProps, { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }> {

  static defaultProps: ISplitFactoryProps = {
    children: null,
    ...DEFAULT_UPDATE_OPTIONS,
  };

  readonly state: Readonly<{ factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }>;
  readonly isFactoryExternal: boolean;

  constructor(props: ISplitFactoryProps) {
    super(props);

    // Log warning and error
    const { factory: propFactory, config } = props;
    if (!config && !propFactory) {
      console.error(ERROR_SF_NO_CONFIG_AND_FACTORY);
    }
    if (config && propFactory) {
      console.log(WARN_SF_CONFIG_AND_FACTORY);
    }

    // Instantiate factory
    let factory = null;
    if (propFactory) {
      factory = propFactory;
    } else {
      if (config) {
        // We use an idempotent variant of the Split factory builder (i.e., given the same config, it returns the same already
        // created instance), since React component constructors is part of render-phase and can be invoked multiple times.
        factory = getSplitFactory(config);
      }
    }
    this.isFactoryExternal = propFactory ? true : false;

    // Instantiate main client. Attributes are set on `SplitComponent.getDerivedStateFromProps`
    const client = factory ? getSplitClient(factory) : null;

    this.state = {
      client,
      factory,
    };
  }

  componentWillUnmount() {
    // only destroy the client if the factory was created internally. Otherwise, the shutdown must be handled by the user
    if (!this.isFactoryExternal && this.state.factory) {
      destroySplitFactory(this.state.factory as IFactoryWithClients);
    }
  }

  render() {
    const { factory, client } = this.state;

    return (
      <SplitComponent {...this.props} factory={factory} client={client} />
    );
  }
}
