import { SplitFactory as SplitSDK } from '@splitsoftware/splitio';
import React from 'react';

import SplitContext from './SplitContext';
import { ISplitContextValues, ISplitFactoryProps, IClientWithStatus } from './types';
import { VERSION, WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';

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

  constructor(props: ISplitFactoryProps) {
    super(props);

    // Log warning and error
    const { factory: propFactory, config, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate } = props;
    if (!config && !propFactory) {
      console.error(ERROR_SF_NO_CONFIG_AND_FACTORY);
    }
    if (config && propFactory) {
      console.log(WARN_SF_CONFIG_AND_FACTORY);
    }

    // Instantiate factory and main client.
    const factory = propFactory || (config ? SplitSDK(config) : null);
    // Don't try this at home. Only override the version when we create our own factory.
    if (config && factory) {
      (factory.settings.version as any) = VERSION;
    }

    const client = factory ? (factory.client() as IClientWithStatus) : null;

    if (client) {
      this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache);
    }

    this.state = {
      client,
      factory,
      isReady: client ? client.isReady() : false,
      isReadyFromCache: client ? client.isReadyFromCache() : false,
      isTimedout: client ? client.hasTimedout() && !client.isReady() : false,
      hasTimedout: client ? client.hasTimedout() : false,
      isDestroyed: client ? client.isDestroyed() : false,
      lastUpdate: 0,
    };
  }

  // Listen SDK events
  subscribeToEvents(client: IClientWithStatus, updateOnSdkUpdate?: boolean, updateOnSdkTimedout?: boolean, updateOnSdkReady?: boolean, updateOnSdkReadyFromCache?: boolean) {

    if (updateOnSdkReady && !client.isReady()) {
      client.once(client.Event.SDK_READY, () => {
        this.setState({ isReady: true, isTimedout: false, lastUpdate: Date.now() });
      });
    }

    if (updateOnSdkReadyFromCache && !client.isReadyFromCache()) {
      client.once(client.Event.SDK_READY_FROM_CACHE, () => {
        this.setState({ isReadyFromCache: true, lastUpdate: Date.now() });
      });
    }

    if (updateOnSdkTimedout && !client.hasTimedout()) {
      client.once(client.Event.SDK_READY_TIMED_OUT, () => {
        this.setState({ isTimedout: true, hasTimedout: true, lastUpdate: Date.now() });
      });
    }

    if (updateOnSdkUpdate) {
      client.on(client.Event.SDK_UPDATE, () => {
        this.setState({ lastUpdate: Date.now() });
      });
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
