import React from 'react';
import { act, render } from '@testing-library/react';

/** Mocks */
import { mockSdk, Event } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { SplitFactory } from '../SplitFactory';
import { useSplitTreatments } from '../useSplitTreatments';
import { SplitTreatments } from '../SplitTreatments';
import { SplitContext } from '../SplitContext';
import { ISplitTreatmentsChildProps } from '../types';

function validateTreatments({ treatments, isReady, isReadyFromCache }: ISplitTreatmentsChildProps) {
  if (isReady || isReadyFromCache) {
    expect(treatments).toEqual({
      split_test: {
        treatment: 'on',
        config: null,
      }
    })
  } else {
    expect(treatments).toEqual({
      split_test: {
        treatment: 'control',
        config: null,
      }
    })
  }
}

test('useSplitTreatments must update on SDK events', async () => {
  const outerFactory = SplitSdk(sdkBrowser);
  const mainClient = outerFactory.client() as any;
  const user2Client = outerFactory.client('user_2') as any;

  let countSplitContext = 0, countSplitTreatments = 0, countUseSplitTreatments = 0, countUseSplitTreatmentsUser2 = 0, countUseSplitTreatmentsUser2WithUpdate = 0;

  render(
    <SplitFactory factory={outerFactory} >
      <>
        <SplitContext.Consumer>
          {() => countSplitContext++}
        </SplitContext.Consumer>
        <SplitTreatments names={['split_test']}>
          {() => { countSplitTreatments++; return null }}
        </SplitTreatments>
        {React.createElement(() => {
          const context = useSplitTreatments({ names: ['split_test'], attributes: { att1: 'att1' } });
          expect(context.client).toBe(mainClient); // Assert that the main client was retrieved.
          validateTreatments(context);
          countUseSplitTreatments++;
          return null;
        })}
        {React.createElement(() => {
          const context = useSplitTreatments({ names: ['split_test'], splitKey: 'user_2' });
          expect(context.client).toBe(user2Client);
          validateTreatments(context);
          countUseSplitTreatmentsUser2++;
          return null;
        })}
        {React.createElement(() => {
          const context = useSplitTreatments({ names: ['split_test'], splitKey: 'user_2', updateOnSdkUpdate: true });
          expect(context.client).toBe(user2Client);
          validateTreatments(context);
          countUseSplitTreatmentsUser2WithUpdate++;
          return null;
        })}
      </>
    </SplitFactory>
  );

  act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
  act(() => mainClient.__emitter__.emit(Event.SDK_READY));
  act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
  act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
  act(() => user2Client.__emitter__.emit(Event.SDK_READY));
  act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

  // SplitContext renders 3 times: initially, when ready from cache, and when ready.
  expect(countSplitContext).toEqual(3);

  // SplitTreatments and useSplitTreatments render when the context renders.
  expect(countSplitTreatments).toEqual(countSplitContext);
  expect(countUseSplitTreatments).toEqual(countSplitContext);
  expect(mainClient.getTreatmentsWithConfig).toHaveBeenCalledTimes(4);
  expect(mainClient.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], { att1: 'att1' });

  // If useSplitTreatments uses a different client than the context one, it renders when the context renders and when the new client is ready and ready from cache.
  expect(countUseSplitTreatmentsUser2).toEqual(countSplitContext + 2);
  // If it is used with `updateOnSdkUpdate: true`, it also renders when the client emits an SDK_UPDATE event.
  expect(countUseSplitTreatmentsUser2WithUpdate).toEqual(countSplitContext + 3);
  expect(user2Client.getTreatmentsWithConfig).toHaveBeenCalledTimes(5);
  expect(user2Client.getTreatmentsWithConfig).toHaveBeenLastCalledWith(['split_test'], undefined);
});
