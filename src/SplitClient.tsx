import React from 'react';
import SplitContext from './SplitContext';
import { ISplitClientProps, ISplitContextValues, IUpdateProps } from './types';
import { getStatus, getSplitSharedClient } from './utils';
import { ERROR_SC_NO_FACTORY } from './constants';

/**
 * Common component used to handle the status and events of a Split client passed as prop.
 * Reused by both SplitFactory (main client) and SplitClient (shared client) components.
 */
export class SplitComponent extends React.Component<IUpdateProps & { factory: SplitIO.ISDK | null, client: SplitIO.IClient | null }, ISplitContextValues> {

  static defaultProps = {
    updateOnSdkUpdate: false,
    updateOnSdkTimedout: false,
    updateOnSdkReady: true,
    updateOnSdkReadyFromCache: true,
    children: null,
    factory: null,
    client: null,
  };

  // Using `getDerivedStateFromProps` since the state depends on the status of the client in props, which might change over time.
  // It could be avoided by removing the client and its status from the component state.
  // But it implies to have another instance property to use instead of the state, because we need a unique reference value for SplitContext.Producer
  static getDerivedStateFromProps(props: ISplitClientProps & { factory: SplitIO.ISDK | null, client: SplitIO.IClient | null }, state: ISplitContextValues) {
    const { client, factory } = props;
    const status = getStatus(client);
    // no need to compare status.isTimedout, since it derives from isReady and hasTimedout
    if (client !== state.client ||
      status.isReady !== state.isReady ||
      status.isReadyFromCache !== state.isReadyFromCache ||
      status.hasTimedout !== state.hasTimedout ||
      status.isDestroyed !== state.isDestroyed) {
      return {
        client,
        factory,
        ...status,
      };
    }
    return null;
  }

  readonly state: Readonly<ISplitContextValues>;

  constructor(props: ISplitClientProps & { factory: SplitIO.ISDK | null, client: SplitIO.IClient | null }) {
    super(props);
    const { factory, client } = props;

    // Log error if factory is not available
    if (!factory) {
      console.error(ERROR_SC_NO_FACTORY);
    }

    this.state = {
      factory,
      client,
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
    this.subscribeToEvents(this.props.client);
  }

  componentDidUpdate(prevProps: ISplitClientProps & { factory: SplitIO.ISDK | null, client: SplitIO.IClient | null }) {
    if (this.props.client !== prevProps.client) {
      this.unsubscribeFromEvents(prevProps.client);
      this.subscribeToEvents(this.props.client);
    }
  }

  componentWillUnmount() {
    // unsubscrite to SDK client events, to remove references to SplitClient instance methods
    this.unsubscribeFromEvents(this.props.client);
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

/**
 * SplitClient will initialize a new SDK client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * Unlike SplitFactory, the underlying SDK client can be changed during the component lifecycle
 * if the component is updated with a different splitKey or trafficType prop. Since the client can change,
 * its release is not handled by SplitClient but by its container SplitFactory component.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
function SplitClient(props: ISplitClientProps) {
  return (
    <SplitContext.Consumer>{
      (splitContext: ISplitContextValues) => {
        const { factory } = splitContext;
        // getSplitSharedClient is idempotent: it returns the same client given the same factory, Split Key and TT
        const client = factory ? getSplitSharedClient(factory, props.splitKey, props.trafficType) : null;
        return (
          <SplitComponent {...props} factory={factory} client={client} />
        );
      }
    }</SplitContext.Consumer>
  );
}

export default SplitClient;
