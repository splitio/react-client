import { SplitFactory as SplitSDK } from '@splitsoftware/splitio';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import React from 'react';

import SplitContext from './SplitContext';
import { ISplitContextValues, ISplitFactoryProps, IClientWithStatus } from './types';
import { VERSION, WARN_SF_CONFIG_AND_FACTORY, ERROR_SF_NO_CONFIG_AND_FACTORY } from './constants';
import { getClientWithStatus } from './utils';

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
    children: null,
  };

  readonly state: Readonly<ISplitContextValues>;

  constructor(props: ISplitFactoryProps) {
    super(props);

    // Log warning and error
    const { factory: propFactory, config, updateOnSdkReady, updateOnSdkTimedout, updateOnSdkUpdate } = props;
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

    const client = factory ? getClientWithStatus(factory) : null;

    if (client) {
      this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady);
    }

    this.state = {
      client,
      factory,
      isReady: client ? client.isReady : false,
      isTimedout: client ? client.isTimedout : false,
      lastUpdate: 0,
    };
  }

  // Listen SDK events. This method will be updated when SDK provides self synchronous status
  subscribeToEvents(client: IClientWithStatus, updateOnSdkUpdate?: boolean, updateOnSdkTimedout?: boolean, updateOnSdkReady?: boolean) {

    if (!client.isReady) { // client is not ready
      /**
       * client still might be ready if it was created before using `getClientWithStatus` function
       * (for example if the client was instantiated outside SplitClient),
       * thus we have to use the ready() promise instead of an event listener.
       */
      client.ready().then(() => {
        // Update isReady if the client was not changed and updateOnSdkReady is true
        if (this.state.client === client && updateOnSdkReady) {
          this.setState({ isReady: true, isTimedout: false, lastUpdate: Date.now() });
        }
      }, () => {
        // Update isTimedout if the client was not changed and updateOnSdkTimedout is true
        if (this.state.client === client) {
          if (updateOnSdkTimedout) {
            this.setState({ isTimedout: true, lastUpdate: Date.now() });
          }
          // register a listener for SDK_READY event, that might trigger after a timeout
          client.once(client.Event.SDK_READY, () => {
            // Update isReady if the client was not changed and updateOnSdkReady is true
            if (this.state.client === client && updateOnSdkReady) {
              this.setState({ isReady: true, isTimedout: false, lastUpdate: Date.now() });
            }
          });
        }
      });
    }

    // register a listener for SDK_UPDATE event
    if (updateOnSdkUpdate) {
      client.on(client.Event.SDK_UPDATE, this.sdkUpdate);
    }
  }

  sdkUpdate = () => {
    this.setState({ lastUpdate: Date.now() });
  }

  componentWillUnmount() {
    this.state.client?.destroy();
  }

  render() {
    const { children } = this.props;
    const { factory, isReady, isTimedout, lastUpdate } = this.state;

    return (
      <SplitContext.Provider value={this.state} >{
        typeof children === 'function' ?
          children({ factory, isReady, isTimedout, lastUpdate }) :
          this.props.children
      }</SplitContext.Provider>
    );
  }
}

export default SplitFactory;
