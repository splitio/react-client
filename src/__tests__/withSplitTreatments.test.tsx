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
import { ISplitTreatmentsChildProps } from '../types';
import { getControlTreatmentsWithConfig } from '../constants';

describe('withSplitTreatments', () => {

  it(`passes Split props and outer props to the child.
      In this test, the value of "props.treatments" is obteined by the function "getControlTreatmentsWithConfig",
      and not "client.getTreatmentsWithConfig" since the client is not ready.`, (done) => {
    const featureFlagNames = ['split1', 'split2'];
    const Component = withSplitFactory(sdkBrowser)<{ outerProp1: string, outerProp2: number }>(
      ({ outerProp1, outerProp2, factory }) => {
        const SubComponent = withSplitClient('user1')<{ outerProp1: string, outerProp2: number }>(
          withSplitTreatments(featureFlagNames)(
            (props: ISplitTreatmentsChildProps & { outerProp1: string, outerProp2: number }) => {
              const clientMock = factory!.client('user1');
              expect(props.outerProp1).toBe('outerProp1');
              expect(props.outerProp2).toBe(2);
              expect((clientMock.getTreatmentsWithConfig as jest.Mock).mock.calls.length).toBe(0);
              expect(props.treatments).toEqual(getControlTreatmentsWithConfig(featureFlagNames));
              expect(props.isReady).toBe(false);
              expect(props.isReadyFromCache).toBe(false);
              expect(props.hasTimedout).toBe(false);
              expect(props.isTimedout).toBe(false);
              expect(props.isDestroyed).toBe(false);
              expect(props.lastUpdate).toBe(0);
              done();
              return null;
            }));
        return <SubComponent outerProp1={outerProp1} outerProp2={outerProp2} />;
      });
    render(<Component outerProp1='outerProp1' outerProp2={2} />);
  });

});
