import React from 'react';
import { ISplitTreatmentsProps } from './types';
/**
 * SplitTreatments accepts a list of split names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * Since it is a PureComponent, it does a shallow comparison of props to determine if the component should update,
 * i.e., it uses reference identity for `names` and `attributes` props.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
declare class SplitTreatments extends React.PureComponent<ISplitTreatmentsProps> {
    logWarning?: boolean;
    render(): JSX.Element;
    componentDidMount(): void;
}
export default SplitTreatments;
