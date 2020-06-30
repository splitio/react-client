import React from 'react';

import SplitContext from './SplitContext';
import { ISplitContextValues, ISplitFactoryProps } from './types';
import { VERSION, WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';
import { getStatus, IdempotentSplitSDK } from './utils';

/**
 * SplitFactory will initialize the Split SDK and listen for its events in order to update the Split Context.
 * SplitFactory must wrap other components and functions from this library, since they access the Split Context
 * and its elements (factory, clients, etc).
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK}
 */
class SplitFactory extends React.Component<ISplitFactoryProps, ISplitContextValues> {

  static defaultProps: ISplitFactoryProps = {
    updateOnSdkUpdate: false,
    updateOnSdkTimedout: false,
    updateOnSdkReady: true,
    updateOnSdkReadyFromCache: true,
    children: null,
  };

  readonly state: Readonly<ISplitContextValues>;
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

    // Instantiate factory and main client.
    const factory = propFactory || (config ? IdempotentSplitSDK(config) : null);
    this.isFactoryExternal = propFactory ? true : false;
    // Don't try this at home. Only override the version when we create our own factory.
    if (config && factory) {
      (factory.settings.version as any) = VERSION;
    }

    const client = factory ? factory.client() : null;

    this.state = {
      client,
      factory,
      ...getStatus(client),
      lastUpdate: 0,
    };
  }

  componentDidMount() {
    this.subscribeToEvents();
  }

  // Listen SDK events
  subscribeToEvents() {
    const { client } = this.state;
    if (client) {
      const status = getStatus(client);
      const { updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate } = this.props;

      if (updateOnSdkReady && !status.isReady) {
        client.once(client.Event.SDK_READY, () => {
          this.setState({ isReady: true, isTimedout: false, lastUpdate: Date.now() });
        });
      }

      if (updateOnSdkReadyFromCache && !status.isReadyFromCache) {
        client.once(client.Event.SDK_READY_FROM_CACHE, () => {
          this.setState({ isReadyFromCache: true, lastUpdate: Date.now() });
        });
      }

      if (updateOnSdkTimedout && !status.hasTimedout) {
        client.once(client.Event.SDK_READY_TIMED_OUT, () => {
          this.setState({ isTimedout: true, hasTimedout: true, lastUpdate: Date.now() });
        });
      }

      if (updateOnSdkUpdate) {
        client.on(client.Event.SDK_UPDATE, () => {
          this.setState({ lastUpdate: Date.now() });
        });
      }

      // @TODO update state in case some status property change
      // this.setState(status);
    }
  }

  componentWillUnmount() {
    // only destroy the client if the factory was created internally. Otherwise, the shutdown must be handled by the user
    if (!this.isFactoryExternal && this.state.client) {
      this.state.client.destroy();
    }
  }

  render() {
    const { children } = this.props;

    return (
      <SplitContext.Provider value={this.state} >{
        typeof children === 'function' ?
          children({ ...this.state }) :
          this.props.children
      }</SplitContext.Provider>
    );
  }
}

export default SplitFactory;
