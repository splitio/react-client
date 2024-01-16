import React from 'react';
import { SplitContext } from './SplitContext';
import { ISplitClientProps, ISplitContextValues, IUpdateProps } from './types';
import { getStatus, getSplitClient, initAttributes, IClientWithContext } from './utils';
import { DEFAULT_UPDATE_OPTIONS } from './useSplitClient';

/**
 * Common component used to handle the status and events of a Split client passed as prop.
 * Reused by both SplitFactoryProvider (main client) and SplitClient (any client) components.
 */
export class SplitComponent extends React.Component<IUpdateProps & { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null, attributes?: SplitIO.Attributes, children: any }, ISplitContextValues> {

  static defaultProps = {
    children: null,
    factory: null,
    client: null,
    ...DEFAULT_UPDATE_OPTIONS,
  }

  // Using `getDerivedStateFromProps` since the state depends on the status of the client in props, which might change over time.
  // It could be avoided by removing the client and its status from the component state.
  // But it implies to have another instance property to use instead of the state, because we need a unique reference value for SplitContext.Provider
  static getDerivedStateFromProps(props: ISplitClientProps & { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }, state: ISplitContextValues) {
    const { client, factory, attributes } = props;
    // initAttributes can be called in the `render` method too, but it is better here for separation of concerns
    initAttributes(client, attributes);
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

  constructor(props: ISplitClientProps & { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }) {
    super(props);
    const { factory, client } = props;

    this.state = {
      factory,
      client,
      ...getStatus(client),
    };
  }

  // Attach listeners for SDK events, to update state if client status change.
  // The listeners take into account the value of `updateOnSdk***` props.
  subscribeToEvents(client: SplitIO.IBrowserClient | null) {
    if (client) {
      const statusOnEffect = getStatus(client);
      const status = this.state;

      if (this.props.updateOnSdkReady) {
        if (!statusOnEffect.isReady) client.once(client.Event.SDK_READY, this.update);
        else if (!status.isReady) this.update();
      }
      if (this.props.updateOnSdkReadyFromCache) {
        if (!statusOnEffect.isReadyFromCache) client.once(client.Event.SDK_READY_FROM_CACHE, this.update);
        else if (!status.isReadyFromCache) this.update();
      }
      if (this.props.updateOnSdkTimedout) {
        if (!statusOnEffect.hasTimedout) client.once(client.Event.SDK_READY_TIMED_OUT, this.update);
        else if (!status.hasTimedout) this.update();
      }
      if (this.props.updateOnSdkUpdate) client.on(client.Event.SDK_UPDATE, this.update);
    }
  }

  unsubscribeFromEvents(client: SplitIO.IBrowserClient | null) {
    if (client) {
      client.off(client.Event.SDK_READY, this.update);
      client.off(client.Event.SDK_READY_FROM_CACHE, this.update);
      client.off(client.Event.SDK_READY_TIMED_OUT, this.update);
      client.off(client.Event.SDK_UPDATE, this.update);
    }
  }

  update = () => {
    this.setState({ lastUpdate: (this.state.client as IClientWithContext).lastUpdate });
  }

  componentDidMount() {
    this.subscribeToEvents(this.props.client);
  }

  componentDidUpdate(prevProps: ISplitClientProps & { factory: SplitIO.IBrowserSDK | null, client: SplitIO.IBrowserClient | null }) {
    if (this.props.client !== prevProps.client) {
      this.unsubscribeFromEvents(prevProps.client);
      this.subscribeToEvents(this.props.client);
    }
  }

  componentWillUnmount() {
    // unsubscribe from events, to remove references to SplitClient instance methods
    this.unsubscribeFromEvents(this.props.client);
  }

  render() {
    const { children } = this.props;
    return (
      <SplitContext.Provider value={this.state} >
        {
          typeof children === 'function' ?
            children({ ...this.state }) :
            children
        }
      </SplitContext.Provider>
    );
  }
}

/**
 * SplitClient will initialize a new SDK client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * The underlying SDK client can be changed during the component lifecycle
 * if the component is updated with a different splitKey or trafficType prop.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#advanced-instantiate-multiple-sdk-clients}
 */
export function SplitClient(props: ISplitClientProps) {
  return (
    <SplitContext.Consumer>
      {(splitContext: ISplitContextValues) => {
        const { factory } = splitContext;
        // getSplitClient is idempotent like factory.client: it returns the same client given the same factory, Split Key and TT
        const client = factory ? getSplitClient(factory, props.splitKey, props.trafficType) : null;
        return (
          <SplitComponent {...props} factory={factory} client={client} attributes={props.attributes} />
        );
      }}
    </SplitContext.Consumer>
  );
}
