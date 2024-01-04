import React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { withSplitFactory } from '../withSplitFactory';
import { withSplitClient } from '../withSplitClient';
import { withSplitTreatments } from '../withSplitTreatments';
import { getControlTreatmentsWithConfig } from '../utils';

describe('withSplitTreatments', () => {

  it(`passes Split props and outer props to the child.
      In this test, the value of "props.treatments" is obtained by the function "getControlTreatmentsWithConfig",
      and not "client.getTreatmentsWithConfig" since the client is not ready.`, () => {
    const featureFlagNames = ['split1', 'split2'];

    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      ({ outerProp1, outerProp2, factory }) => {
        const SubComponent = withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
          withSplitTreatments(featureFlagNames)(
            (props) => {
              const clientMock = factory!.client('user1');
              expect((clientMock.getTreatmentsWithConfig as jest.Mock).mock.calls.length).toBe(0);

              expect(props).toStrictEqual({
                factory: factory, client: clientMock,
                outerProp1: 'outerProp1', outerProp2: 2,
                treatments: getControlTreatmentsWithConfig(featureFlagNames),
                isReady: false,
                isReadyFromCache: false,
                hasTimedout: false,
                isTimedout: false,
                isDestroyed: false,
                lastUpdate: 0
              });

              return null;
            }
          )
        );
        return <SubComponent outerProp1={outerProp1} outerProp2={outerProp2} />;
      });

    render(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

});
