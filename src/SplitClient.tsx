import React from 'react';
import SplitContext from './SplitContext';
import { ISplitClientProps, ISplitContextValues, IClientWithStatus } from './types';
import { ERROR_SC_NO_FACTORY } from './constants';
import { getClientWithStatus } from './utils';

/**
 * SplitClient will initialize a new Split Client and listen for its events in order to update the Split Context.
 * Children components will have access to this new client when accessing the Split Context.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
class SplitClient extends React.Component<ISplitClientProps & { splitContext: ISplitContextValues }, ISplitContextValues> {

  static contextType = SplitContext;

  static defaultProps = {
    updateOnSdkUpdate: false,
    updateOnSdkTimedout: false,
    updateOnSdkReady: true,
    children: null,
  };

  readonly state: Readonly<ISplitContextValues>;

  constructor(props: ISplitClientProps & { splitContext: ISplitContextValues }) {
    super(props);

    const { splitKey, trafficType, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, splitContext: { factory } } = props;

    // Log error if factory is not available
    if (!factory) {
      console.error(ERROR_SC_NO_FACTORY);
    }

    // Init new client
    const client = factory ? getClientWithStatus(factory, splitKey, trafficType) : null;

    if (client) {
      this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady);
    }

    this.state = {
      ...props.splitContext,
      client,
      isReady: client ? client.isReady : false,
      isTimedout: client ? client.isTimedout : false,
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
      }).catch(() => {
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

  shouldComponentUpdate(
    { splitContext: { factory }, splitKey, trafficType, updateOnSdkReady, updateOnSdkTimedout, updateOnSdkUpdate }: ISplitClientProps & { splitContext: ISplitContextValues },
    nextState: ISplitContextValues) {

    const client = factory ? getClientWithStatus(factory, splitKey, trafficType) : null;

    if (client !== nextState.client && client) {
      this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady);

      // Deregister listener for previous client
      if (nextState.client) {
        nextState.client.removeListener(client.Event.SDK_UPDATE, this.sdkUpdate);
      }

      this.setState({
        client,
        isReady: client ? client.isReady : false,
        isTimedout: client ? client.isTimedout : false,
      });
      return false;
    }

    // Update when the client or its status change
    // (no need to compara isReady or isTimedout, lastUpdate is enough).
    // Don't update when updateOnSdk** props change.
    return this.state.client !== nextState.client ||
           this.state.lastUpdate !== nextState.lastUpdate;
  }

  render() {
    const { children } = this.props;
    const { client, isReady, isTimedout, lastUpdate } = this.state;

    return (
      <SplitContext.Provider value={this.state} >{
        typeof children === 'function' ?
          children({ client, isReady, isTimedout, lastUpdate }) :
          children
      }</SplitContext.Provider>
    );
  }
}

// Wrapper to access Split context on SplitClient constructor
export default (props: ISplitClientProps) => (
  <SplitContext.Consumer>
    {(splitContext: ISplitContextValues) =>
      <SplitClient {...props} splitContext={splitContext} />
    }
  </SplitContext.Consumer>
);
