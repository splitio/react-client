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

  // We could avoid this method by removing the client and its status from the component state.
  // But we would need another instance object to keep this data and use, instead of the state, as unique reference value for SplitContext.Producer
  static getDerivedStateFromProps(props: ISplitFactoryProps, state: ISplitContextValues) {
    const status = getStatus(state.client);
    // no need to compare status.isTimedout, since it derives from isReady and hasTimedout
    if (status.isReady !== state.isReady ||
      status.isReadyFromCache !== state.isReadyFromCache ||
      status.hasTimedout !== state.hasTimedout ||
      status.isDestroyed !== state.isDestroyed) {
      return status;
    }
    return null;
  }

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
    // We use an idempotent variant of the Split factory builder (i.e., given the same config, it returns the
    // same already created instance), since React component constructors can be invoked multiple times.
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

  // Attach listeners for SDK events, to update state if client status change.
  // The listeners take into account the value of `updateOnSdk***` props.
  subscribeToEvents(client: SplitIO.IClient | null) {
    if (client) {
      client.once(client.Event.SDK_READY, this.setReady);
      client.once(client.Event.SDK_READY_FROM_CACHE, this.setReadyFromCache);
      client.once(client.Event.SDK_READY_TIMED_OUT, this.setTimedout);
      client.on(client.Event.SDK_UPDATE, this.setUpdate);
    }
  }

  unsubscribeFromEvents(client: SplitIO.IClient | null) {
    if (client) {
      client.removeListener(client.Event.SDK_READY, this.setReady);
      client.removeListener(client.Event.SDK_READY_FROM_CACHE, this.setReadyFromCache);
      client.removeListener(client.Event.SDK_READY_TIMED_OUT, this.setTimedout);
      client.removeListener(client.Event.SDK_UPDATE, this.setUpdate);
    }
  }

  setReady = () => {
    if (this.props.updateOnSdkReady) this.setState({ lastUpdate: Date.now() });
  }

  setReadyFromCache = () => {
    if (this.props.updateOnSdkReadyFromCache) this.setState({ lastUpdate: Date.now() });
  }

  setTimedout = () => {
    if (this.props.updateOnSdkTimedout) this.setState({ lastUpdate: Date.now() });
  }

  setUpdate = () => {
    if (this.props.updateOnSdkUpdate) this.setState({ lastUpdate: Date.now() });
  }

  componentDidMount() {
    this.subscribeToEvents(this.state.client);
  }

  componentWillUnmount() {
    // unsubscrite to SDK client events. Mainly required when the factory is provided externally
    this.unsubscribeFromEvents(this.state.client);

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
          children
      }</SplitContext.Provider>
    );
  }
}

export default SplitFactory;
