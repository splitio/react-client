import React from 'react';
import shallowEqual from 'shallowequal';
import SplitContext from './SplitContext';
import { ISplitTreatmentsProps, ISplitContextValues } from './types';
import { getControlTreatmentsWithConfig, WARN_ST_NO_CLIENT } from './constants';

/**
 * SplitTreatments accepts a list of split names and optional attributes. It access the client at SplitContext to
 * call 'client.getTreatmentsWithConfig()' method, and passes the returned treatments to a child as a function.
 *
 * Since it is a PureComponent, it does a shallow comparison of props to determine if the component should update,
 * i.e., it uses reference identity for `names` and `attributes` props.
 *
 * @see {@link https://help.split.io/hc/en-us/articles/360020448791-JavaScript-SDK#get-treatments-with-configurations}
 */
class SplitTreatments extends React.Component<ISplitTreatmentsProps> {

  logWarning?: boolean;

  // The component updates if:
  // - SplitContext changes, i.e., if the client or status properties tracked by `updateSdk***` props change
  // - split names or attributes change (shouldComponentUpdate condition)
  shouldComponentUpdate(nextProps: Readonly<ISplitTreatmentsProps>) {
    return !shallowEqual(this.props.names, nextProps.names) ||
      !shallowEqual(this.props.attributes, nextProps.attributes);
  }

  render() {
    const { names, children, attributes } = this.props;

    return (
      <SplitContext.Consumer>
        {(splitContext: ISplitContextValues) => {
          const { client, isReady, isReadyFromCache, isDestroyed } = splitContext;
          let treatments;
          const isOperational = !isDestroyed && (isReady || isReadyFromCache);
          if (client && isOperational) {
            treatments = client.getTreatmentsWithConfig(names, attributes);
          } else {
            treatments = getControlTreatmentsWithConfig(names);
            if (!client) { this.logWarning = true; }
          }
          // SplitTreatments only accepts a function as a child, not a React Element (JSX)
          return children({
            ...splitContext, treatments,
          });
        }}
      </SplitContext.Consumer>
    );
  }

  componentDidMount() {
    if (this.logWarning) { console.log(WARN_ST_NO_CLIENT); }
  }

}

export default SplitTreatments;
