import React from 'react';
import { SplitContext } from './SplitContext';
import { getControlTreatmentsWithConfig } from './constants';
import { ISplitContextValues, ISplitTreatmentsProps } from './types';
import { memoizeGetTreatmentsWithConfig } from './utils';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function SplitTreatments(props: ISplitTreatmentsProps) {
  const { names, children, attributes } = props;
  const getTreatmentsWithConfig = React.useMemo(memoizeGetTreatmentsWithConfig, []);

  return (
    <SplitContext.Consumer>
      {(splitContext: ISplitContextValues) => {
        const { client, isReady, isReadyFromCache, isDestroyed, lastUpdate } = splitContext;
        let treatments;
        const isOperational = !isDestroyed && (isReady || isReadyFromCache);
        if (client && isOperational) {
          // Cloning `client.getAttributes` result for memoization, because it returns the same reference unless `client.clearAttributes` is called.
          // Caveat: same issue happens with `names` and `attributes` props if the user follows the bad practice of mutating the object instead of providing a new one.
          treatments = getTreatmentsWithConfig(client, lastUpdate, names, attributes, { ...client.getAttributes() });
        } else {
          treatments = getControlTreatmentsWithConfig(names);
        }
        // SplitTreatments only accepts a function as a child, not a React Element (JSX)
        return children({
          ...splitContext, treatments,
        });
      }}
    </SplitContext.Consumer>
  );
}
