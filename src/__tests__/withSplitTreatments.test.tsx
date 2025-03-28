import * as React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, getLastInstance, Event } from './testUtils/mockSplitFactory';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { withSplitFactory } from '../withSplitFactory';
import { withSplitClient } from '../withSplitClient';
import { withSplitTreatments } from '../withSplitTreatments';
import { getControlTreatmentsWithConfig } from '../utils';

const featureFlagNames = ['split1', 'split2'];

describe('withSplitTreatments', () => {

  it(`passes Split props and outer props to the child.
      In this test, the value of "props.treatments" is obtained by the function "getControlTreatmentsWithConfig",
      and not "client.getTreatmentsWithConfig" since the client is not ready.`, () => {

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

  it('disabling "updateOnSdkTimedout" requires passing `false` in all HOCs since the default value is `true`.', () => {

    let renderCount = 0;

    const Component = withSplitFactory(sdkBrowser)(
      withSplitClient(sdkBrowser.core.key)(
        withSplitTreatments(featureFlagNames)(
          (props) => {
            renderCount++;
            expect(props.hasTimedout).toBe(false);

            return null;
          }, undefined, false
        ), undefined, false
      ), undefined, false
    );

    render(<Component />);

    act(() => getLastInstance(SplitFactory).client().__emitter__.emit(Event.SDK_READY_TIMED_OUT));

    expect(renderCount).toBe(1);
  });

});
