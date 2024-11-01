import React from 'react';

import { SplitContext } from './SplitContext';
import { ISplitTreatmentsProps } from './types';
import { useSplitTreatments } from './useSplitTreatments';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It accesses the client at SplitContext to
 * call the 'client.getTreatmentsWithConfig()' method if the `names` prop is provided, or the 'client.getTreatmentsWithConfigByFlagSets()' method
 * if the `flagSets` prop is provided. It then passes the resulting treatments to a child component as a function.
 *
 * @deprecated `SplitTreatments` will be removed in a future major release. We recommend replacing it with the `useSplitTreatments` hook.
 */
export function SplitTreatments(props: ISplitTreatmentsProps) {
  const { children } = props;
  const context = useSplitTreatments(props);

  return (
    <SplitContext.Provider value={context}>
      {
        children(context)
      }
    </SplitContext.Provider>
  );
}
