import React from 'react';
import { ISplitTreatmentsProps } from './types';
/**
 * SplitTreatments accepts a list of split names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export declare class SplitTreatments extends React.Component<ISplitTreatmentsProps> {
    private logWarning?;
    private evaluateSplits;
    render(): JSX.Element;
    componentDidMount(): void;
}
