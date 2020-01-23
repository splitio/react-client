import * as React from 'react';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import { ISplitTreatmentsChildProps } from './types';
import SplitTreatments from './SplitTreatments';

/**
 * High-Order Component for SplitTreatments.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitTreatments (see ISplitTreatmentsChildProps).
 *
 * @param names list of Split names
 * @param attributes An object of type Attributes used to evaluate the splits.
 */
function withSplitTreatments(names: string[], attributes?: SplitIO.Attributes) {

  return function withSplitTreatmentsHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitTreatmentsChildProps>,
  ) {

    return (props: OuterProps) => {
      return (
        <SplitTreatments
          names={names}
          attributes={attributes} >
          {(splitProps) => {
            return (
              <WrappedComponent
                {...props} {...splitProps} />
            );
          }}
        </SplitTreatments>
      );
    };
  };
}

export default withSplitTreatments;
