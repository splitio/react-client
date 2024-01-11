import React from 'react';
import { SplitContext } from './SplitContext';
import { ISplitTreatmentsProps, ISplitContextValues } from './types';
import { memoizeGetTreatmentsWithConfig } from './utils';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It accesses the client at SplitContext to
 * call the 'client.getTreatmentsWithConfig()' method if the `names` prop is provided, or the 'client.getTreatmentsWithConfigByFlagSets()' method
 * if the `flagSets` prop is provided. It then passes the resulting treatments to a child component as a function.
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
          const { client, lastUpdate } = splitContext;
          const treatments = this.evaluateFeatureFlags(client, lastUpdate, names, attributes, client ? { ...client.getAttributes() } : {}, flagSets);

          // SplitTreatments only accepts a function as a child, not a React Element (JSX)
          return children({
            ...splitContext, treatments,
          });
        }}
      </SplitContext.Consumer>
    );
  }
}
