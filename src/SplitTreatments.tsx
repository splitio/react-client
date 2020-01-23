import React from 'react';
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
class SplitTreatments extends React.PureComponent<ISplitTreatmentsProps> {

  logWarning?: boolean;

  render() {
    const { names, children, attributes } = this.props;

    return (
      <SplitContext.Consumer>
        {({ client, isReady, isTimedout, lastUpdate }: ISplitContextValues) => {
          let treatments;
          if (!isReady || !client) {
            treatments = getControlTreatmentsWithConfig(names);
            if (!client) { this.logWarning = true; }
          } else {
            treatments = client.getTreatmentsWithConfig(names, attributes);
          }
          return children({
            treatments, isReady, isTimedout, lastUpdate,
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
