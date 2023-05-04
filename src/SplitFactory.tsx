import React from 'react';

import { SplitComponent } from './SplitClient';
import { ISplitFactoryProps } from './types';
import { VERSION, WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, IFactoryWithClients } from './utils';

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
export class SplitFactory extends React.Component<ISplitFactoryProps, { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }> {

  static defaultProps: ISplitFactoryProps = {
    updateOnSdkUpdate: false,
    updateOnSdkTimedout: false,
    updateOnSdkReady: true,
    updateOnSdkReadyFromCache: true,
    children: null,
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
        // Don't try this at home. Used to overwrite the settings version when we create our own factory.
        (config as any).version = VERSION;
        // We use an idempotent variant of the Split factory builder (i.e., given the same config, it returns the same already
        // created instance), since React component constructors is part of render-phase and can be invoked multiple times.
        factory = getSplitFactory(config);
      }
    }
    this.isFactoryExternal = propFactory ? true : false;

    // Instantiate main client.
    const client = factory ? factory.client() : null;

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
