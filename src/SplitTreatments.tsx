import { ISplitTreatmentsProps } from './types';
import { useSplitTreatments } from './useSplitTreatments';

/**
 * SplitTreatments accepts a list of feature flag names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
export function SplitTreatments(props: ISplitTreatmentsProps) {
  const { names, attributes, children } = props;
  // SplitTreatments doesn't update on SDK events, since it is inside SplitFactory and/or SplitClient.
  const context = useSplitTreatments(names, attributes, undefined, { updateOnSdkReady: false, updateOnSdkTimedout: false });
  return children(context);

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
