import React from 'react';
import { ISplitTreatmentsChildProps } from './types';
/**
 * High-Order Component for SplitTreatments.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitTreatments (see ISplitTreatmentsChildProps).
 *
 * @param names list of feature flag names
 * @param attributes An object of type Attributes used to evaluate the feature flags.
 */
declare function withSplitTreatments(names: string[], attributes?: SplitIO.Attributes): <OuterProps>(WrappedComponent: React.ComponentType<OuterProps & ISplitTreatmentsChildProps>) => (props: OuterProps) => JSX.Element;
export default withSplitTreatments;
