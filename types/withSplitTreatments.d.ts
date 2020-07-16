import React from 'react';
import SplitIO from '@splitsoftware/splitio/types/splitio';
import { ISplitTreatmentsChildProps } from './types';
/**
 * High-Order Component for SplitTreatments.
 * The wrapped component receives all the props of the container,
 * along with the passed props from SplitTreatments (see ISplitTreatmentsChildProps).
 *
 * @param names list of Split names
 * @param attributes An object of type Attributes used to evaluate the splits.
 */
declare function withSplitTreatments(names: string[], attributes?: SplitIO.Attributes): <OuterProps>(WrappedComponent: React.ComponentType<OuterProps & ISplitTreatmentsChildProps>) => (props: OuterProps) => JSX.Element;
export default withSplitTreatments;
