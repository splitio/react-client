import React from 'react';

import { SplitComponent } from './SplitClient';
import { ISplitFactoryProps } from './types';
import { WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';
import { getSplitFactory, destroySplitFactory, IFactoryWithClients, getSplitClient, isServerEnvironment } from './utils';
import { DEFAULT_UPDATE_OPTIONS } from './useSplitClient';

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
    children: null,
    ...DEFAULT_UPDATE_OPTIONS,
  };

  readonly state: Readonly<{ factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }>;

  constructor(props: ISplitFactoryProps) {
    super(props);

    let { factory, config } = props;

    // At the moment, SSR is supported only with the SDK running in the client. So, it cannot create or use a factory in server-side, to avoid instantiating a factory per request/session.
    if (isServerEnvironment) {
      // @TODO Remove when SSR is supported with the SDK running in the server (initialState prop)
      factory = undefined;
      // @TODO Remove when SplitFactory component creates the factory in the commit phase (breaking change)
      config = undefined;
    }

    // Instantiate factory
    if (!factory && config) {
      // We use an idempotent variant of the Split factory builder (i.e., given the same config, it returns the same already
      // created instance), since React component constructors is part of render-phase and can be invoked multiple times.
      factory = getSplitFactory(config);
    }

    this.state = {
      // Instantiate main client. Attributes are set on `SplitComponent.getDerivedStateFromProps`
      client: factory ? getSplitClient(factory) : null,
      factory: factory || null,
    };
  }

  componentDidMount() {
    // Log warning and errors on client-side
    const { factory, config } = this.props;
    if (!config && !factory) {
      console.error(ERROR_SF_NO_CONFIG_AND_FACTORY);
    }
    if (config && factory) {
      console.log(WARN_SF_CONFIG_AND_FACTORY);
    }
  }

  componentWillUnmount() {
    // only destroy the client if the factory was created internally. Otherwise, the shutdown must be handled by the user
    if (!this.props.factory && this.state.factory) {
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
