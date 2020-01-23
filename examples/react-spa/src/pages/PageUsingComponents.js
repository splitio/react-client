import React from 'react';
import { SplitClient, SplitTreatments } from '@splitsoftware/splitio-react';
import { feature_1, feature_2, feature_3 } from '../sdkConfig';

/* This example showcasts SplitClient and SplitTreatments components */

const Loading = () => {
  return <div>Loading SDK...</div>
}

export default () => {
  return (
    <main>

      <SplitTreatments names={[feature_1]} >
        {({ treatments }) => {
          return (
            <div className="App-section">
              <h4>{`Split: ${feature_1}`}</h4>
              <p>{`Treatment value: ${treatments[feature_1].treatment}`}</p>
            </div>
          )
        }}
      </SplitTreatments>

      <SplitClient splitKey="other_user" >
        <SplitTreatments names={[feature_2, feature_3]} >
          {({ treatments, isReady }) => {
            return isReady ? (
              <div className="App-section">{
                Object.entries(treatments).map(([splitName, treatment]) =>
                  <div key={splitName} >
                    <h4>{`Split: ${splitName}`}</h4>
                    <p>{`Treatment value: ${treatment.treatment}`}</p>
                  </div>
                )
              }</div>
            ) : <Loading />
          }}
        </SplitTreatments>
      </SplitClient>

    </main>
  );
}
