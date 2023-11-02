import React from 'react';
import { SplitContext } from './SplitContext';
import { ISplitTreatmentsProps, ISplitContextValues } from './types';
import { getControlTreatmentsWithConfig, WARN_ST_NO_CLIENT } from './constants';
import { memoizeGetTreatmentsWithConfig } from './utils';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It accesses the client at SplitContext to
 * call the 'client.getTreatmentsWithConfig()' method if a `names` prop is provided, or the 'client.getTreatmentsWithConfigByFlagSets()' method
 * if a `flagSets` prop is provided. It then passes the resulting treatments to a child component as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export class SplitTreatments extends React.Component<ISplitTreatmentsProps> {

  private logWarning?: boolean;

  // Using a memoized `client.getTreatmentsWithConfig` function to avoid duplicated impressions
  private evaluateFeatureFlags = memoizeGetTreatmentsWithConfig();

  render() {
    const { names, flagSets, children, attributes } = this.props;

    return (
      <SplitContext.Consumer>
        {(splitContext: ISplitContextValues) => {
          const { client, isReady, isReadyFromCache, isDestroyed, lastUpdate } = splitContext;
          let treatments;
          const isOperational = !isDestroyed && (isReady || isReadyFromCache);
          if (client && isOperational) {
            // Cloning `client.getAttributes` result for memoization, because it returns the same reference unless `client.clearAttributes` is called.
            // Caveat: same issue happens with `names` and `attributes` props if the user follows the bad practice of mutating the object instead of providing a new one.
            treatments = this.evaluateFeatureFlags(client, lastUpdate, names, attributes, { ...client.getAttributes() }, flagSets);
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
