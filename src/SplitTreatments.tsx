import React from 'react';
import memoizeOne from 'memoize-one';
import shallowEqual from 'shallowequal';
import SplitContext from './SplitContext';
import { ISplitTreatmentsProps, ISplitContextValues } from './types';
import { getControlTreatmentsWithConfig, WARN_ST_NO_CLIENT } from './constants';

function argsAreEqual(newArgs: any[], lastArgs: any[]): boolean {
  return newArgs[0] === lastArgs[0] && // client
    newArgs[1] === lastArgs[1] && // lastUpdate
    shallowEqual(newArgs[2], lastArgs[2]) && // names
    shallowEqual(newArgs[3], lastArgs[3]) && // attributes
    shallowEqual(newArgs[4], lastArgs[4]); // client attributes
}

function evaluateSplits(client: SplitIO.IBrowserClient, lastUpdate: number, names: SplitIO.SplitNames, attributes?: SplitIO.Attributes, clientAttributes?: SplitIO.Attributes) {
  return client.getTreatmentsWithConfig(names, attributes);
}

/**
 * SplitTreatments accepts a list of split names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
class SplitTreatments extends React.Component<ISplitTreatmentsProps> {

  private logWarning?: boolean;

  // Attaching a memoized `client.getTreatmentsWithConfig` function to the component instance, to avoid duplicated impressions because
  // the function result is the same given the same `client` instance, `lastUpdate` timestamp, and list of split `names` and `attributes`.
  private evaluateSplits = memoizeOne(evaluateSplits, argsAreEqual);

  render() {
    const { names, children, attributes } = this.props;

    return (
      <SplitContext.Consumer>
        {(splitContext: ISplitContextValues) => {
          const { client, isReady, isReadyFromCache, isDestroyed, lastUpdate } = splitContext;
          let treatments;
          const isOperational = !isDestroyed && (isReady || isReadyFromCache);
          if (client && isOperational) {
            treatments = this.evaluateSplits(client, lastUpdate, names, attributes, client.getAttributes());
          } else {
            treatments = getControlTreatmentsWithConfig(names);
            if (!client) { this.logWarning = true; }
          }
          // SplitTreatments only accepts a function as a child, not a React Element (JSX)
          return children({
            ...splitContext, treatments,
          });
        }}
      </SplitContext.Consumer>
    );
  }

  componentDidMount() {
    if (this.logWarning) { console.log(WARN_ST_NO_CLIENT); }
  }

}

export default SplitTreatments;
