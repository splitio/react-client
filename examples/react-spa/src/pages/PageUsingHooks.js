import React, { useState } from 'react';
import { useClient, useTreatments } from '@splitsoftware/splitio-react';
import { feature_1, feature_2, feature_3 } from '../sdkConfig';

/* This example showcasts useClient and useTreatments hooks */

const Loading = () => {
  return <div>Loading SDK...</div>
}

export default () => {

  const treatment = useTreatments([feature_1]);

  const FeatureOne = (
    <div className="App-section">
      <h4>{`Split: ${feature_1}`}</h4>
      <p>{`Treatment value: ${treatment[feature_1].treatment}`}</p>
    </div>
  );

  const [isReady, setReady] = useState(false);
  const client = useClient('other_user');
  client.ready().then(() => { setReady(true) });

  const treatments = client.getTreatmentsWithConfig([feature_2, feature_3]);
  const OtherFeatures = (
    isReady ? (
      <div className="App-section">{
        Object.entries(treatments).map(([splitName, treatment]) =>
          <div key={splitName} >
            <h4>{`Split: ${splitName}`}</h4>
            <p>{`Treatment value: ${treatment.treatment}`}</p>
          </div>
        )
      }</div>
    ) : <Loading />
  );

  return (
    <main>
      {FeatureOne}
      {OtherFeatures}
    </main>
  )
}
