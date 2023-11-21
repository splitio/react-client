import React from 'react';

import { SplitContext } from './SplitContext';
import { ISplitTreatmentsProps } from './types';
import { useSplitTreatments } from './useSplitTreatments';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It accesses the client at SplitContext to
 * call the 'client.getTreatmentsWithConfig()' method if the `names` prop is provided, or the 'client.getTreatmentsWithConfigByFlagSets()' method
 * if the `flagSets` prop is provided. It then passes the resulting treatments to a child component as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function SplitTreatments(props: ISplitTreatmentsProps) {
  const { children } = props;
  // SplitTreatments doesn't update on SDK events, since it is inside SplitFactory and/or SplitClient.
  const context = useSplitTreatments({ updateOnSdkReady: false, updateOnSdkTimedout: false, ...props });

  // return children(context);
  return (
    <SplitContext.Provider value={context}>
      {
        children({ ...context })
      }
    </SplitContext.Provider>
  );

  // // @TODO eventually update as follows, and remove SplitClient?
  // return (
  //   <SplitContext.Provider value={context}>
  //     {
  //       typeof children === 'function' ?
  //         children({ ...context }) :
  //         children
  //     }
  //   </SplitContext.Provider>
  // );
}
