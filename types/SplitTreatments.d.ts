/// <reference types="react" />
import { ISplitTreatmentsProps } from './types';
/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export declare function SplitTreatments(props: ISplitTreatmentsProps): JSX.Element | null;
