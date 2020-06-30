import React from 'react';
import SplitContext from './SplitContext';
import { ISplitClientProps, ISplitContextValues } from './types';
import { getStatus } from './utils';
import { ERROR_SC_NO_FACTORY } from './constants';

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
    updateOnSdkReadyFromCache: true,
    children: null,
  };

  readonly state: Readonly<ISplitContextValues>;

  constructor(props: ISplitClientProps & { splitContext: ISplitContextValues }) {
    super(props);

    const { splitKey, trafficType, splitContext: { factory } } = props;

    // Log error if factory is not available
    if (!factory) {
      console.error(ERROR_SC_NO_FACTORY);
    }

    // Init new client
    const client = factory ? factory.client(splitKey, trafficType) : null;

    this.state = {
      ...props.splitContext,
      client,
      ...getStatus(client),
    };
  }

  componentDidMount() {
    const { client } = this.state;
    if (client) {
      const { updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkUpdate, updateOnSdkTimedout } = this.props;
      this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache);
    }
  }

  // Listen SDK events
  subscribeToEvents(client: SplitIO.IClient, updateOnSdkUpdate?: boolean, updateOnSdkTimedout?: boolean, updateOnSdkReady?: boolean, updateOnSdkReadyFromCache?: boolean) {

    const status = getStatus(client);

    if (updateOnSdkReady && !status.isReady) {
      client.once(client.Event.SDK_READY, this.setReady);
    }

    if (updateOnSdkReadyFromCache && !status.isReadyFromCache) {
      client.once(client.Event.SDK_READY_FROM_CACHE, this.setReadyFromCache);
    }

    if (updateOnSdkTimedout && !status.hasTimedout) {
      client.once(client.Event.SDK_READY_TIMED_OUT, this.setTimedout);
    }

    if (updateOnSdkUpdate) {
      client.on(client.Event.SDK_UPDATE, this.setUpdate);
    }

    // @TODO update state in case some status property change
    // this.setState(status);
  }

  setReady = () => {
    this.setState({ isReady: true, isTimedout: false, lastUpdate: Date.now() });
  }

  setReadyFromCache = () => {
    this.setState({ isReadyFromCache: true, lastUpdate: Date.now() });
  }

  setTimedout = () => {
    this.setState({ isTimedout: true, hasTimedout: true, lastUpdate: Date.now() });
  }

  setUpdate = () => {
    this.setState({ lastUpdate: Date.now() });
  }

  unsubscribeFromEvents(client: SplitIO.IClient) {
    client.removeListener(client.Event.SDK_READY, this.setReady);
    client.removeListener(client.Event.SDK_READY_FROM_CACHE, this.setReadyFromCache);
    client.removeListener(client.Event.SDK_READY_TIMED_OUT, this.setTimedout);
    client.removeListener(client.Event.SDK_UPDATE, this.setUpdate);
  }

  /**
   * The component is updated if:
   *  - the factory at Split context change or `splitKey` and `trafficType` props change, because it implies that the component has a new SDK client.
   *  - the client status change for the subscribed events set by `updateOnSdk***` props.
   *
   * The component is not updated if updateOnSdk** props change, but they change what status events trigger component updates.
   */
  shouldComponentUpdate(
    { splitContext: { factory }, splitKey, trafficType, updateOnSdkReady, updateOnSdkReadyFromCache, updateOnSdkTimedout, updateOnSdkUpdate }: ISplitClientProps & { splitContext: ISplitContextValues },
    nextState: ISplitContextValues) {

    const client = factory ? factory.client(splitKey, trafficType) : null;

    // resubscribe to events whether client changed or updateOnSdk** props changed
    const changeListeners = client !== nextState.client ||
      this.props.updateOnSdkReady !== updateOnSdkReady ||
      this.props.updateOnSdkReadyFromCache !== updateOnSdkReadyFromCache ||
      this.props.updateOnSdkTimedout !== updateOnSdkTimedout ||
      this.props.updateOnSdkUpdate !== updateOnSdkUpdate;

    if (changeListeners) {
      if (nextState.client) this.unsubscribeFromEvents(nextState.client);
      if (client) this.subscribeToEvents(client, updateOnSdkUpdate, updateOnSdkTimedout, updateOnSdkReady, updateOnSdkReadyFromCache);
    }

    // if client has changed, we update it and its status at the component state
    if (client !== nextState.client) {
      this.setState({
        client,
        factory, // factory might have changed in the Split context
        ...getStatus(client),
      });
      return false;
    }

    // Update when the client or its status change
    // (no need to compara isReady, isReadyFromCache or isTimedout. lastUpdate is enough).
    // Don't update when updateOnSdk** props change.
    return this.state.client !== nextState.client ||
      this.state.lastUpdate !== nextState.lastUpdate;
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

// Wrapper to access Split context on SplitClient constructor
export default (props: ISplitClientProps) => (
  <SplitContext.Consumer>
    {(splitContext: ISplitContextValues) =>
      <SplitClient {...props} splitContext={splitContext} />
    }
  </SplitContext.Consumer>
);
