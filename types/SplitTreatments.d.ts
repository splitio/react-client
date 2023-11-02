import React from 'react';
import { ISplitTreatmentsProps } from './types';
/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It accesses the client at SplitContext to
 * call the 'client.getTreatmentsWithConfig()' method if a `names` prop is provided, or the 'client.getTreatmentsWithConfigByFlagSets()' method
 * if a `flagSets` prop is provided. It then passes the resulting treatments to a child component as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export declare class SplitTreatments extends React.Component<ISplitTreatmentsProps> {
    private logWarning?;
    private evaluateFeatureFlags;
    render(): JSX.Element;
    componentDidMount(): void;
}
