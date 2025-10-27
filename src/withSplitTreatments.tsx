import * as React from 'react';
import { ISplitTreatmentsChildProps } from './types';
import { SplitTreatments } from './SplitTreatments';

/**
 * High-Order Component for SplitTreatments.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitTreatments (see ISplitTreatmentsChildProps).
 *
 * @param names - list of feature flag names
 * @param attributes - An object of type Attributes used to evaluate the feature flags.
 *
 * @deprecated `withSplitTreatments` will be removed in a future major release. We recommend replacing it with the `useTreatment*` hooks.
 */
export function withSplitTreatments(names: string[], attributes?: SplitIO.Attributes) {

  return function withSplitTreatmentsHoc<OuterProps>(
    WrappedComponent: React.ComponentType<OuterProps & ISplitTreatmentsChildProps>,
    updateOnSdkUpdate?: boolean,
    updateOnSdkTimedout?: boolean,
    updateOnSdkReady?: boolean,
    updateOnSdkReadyFromCache?: boolean,
  ) {

    return function wrapper(props: OuterProps) {
      return (
        <SplitTreatments
          names={names}
          updateOnSdkUpdate={updateOnSdkUpdate}
          updateOnSdkTimedout={updateOnSdkTimedout}
          updateOnSdkReady={updateOnSdkReady}
          updateOnSdkReadyFromCache={updateOnSdkReadyFromCache}
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
