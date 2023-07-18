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
import { useSplitClient } from '../useSplitClient';
import { SplitClient } from '../SplitClient';
import { SplitContext } from '../SplitContext';

test('useSplitClient', async () => {
  const outerFactory = SplitSdk(sdkBrowser);
  const mainClient = outerFactory.client() as any;
  const user2Client = outerFactory.client('user_2') as any;

  let countSplitContext = 0, countSplitClient = 0, countSplitClientUser2 = 0, countUseSplitClient = 0, countUseSplitClientUser2 = 0;
  let countSplitClientWithUpdate = 0, countUseSplitClientWithUpdate = 0, countSplitClientUser2WithUpdate = 0, countUseSplitClientUser2WithUpdate = 0;
  let countNestedComponent = 0;

  render(
    <SplitFactory factory={outerFactory} >
      <>
        <SplitContext.Consumer>
          {() => countSplitContext++}
        </SplitContext.Consumer>
        <SplitClient splitKey={sdkBrowser.core.key}>
          {() => { countSplitClient++; return null }}
        </SplitClient>
        <SplitClient splitKey={'user_2'}>
          {() => { countSplitClientUser2++; return null }}
        </SplitClient>
        {React.createElement(() => {
          const { client } = useSplitClient(sdkBrowser.core.key, sdkBrowser.core.trafficType, { att1: 'att1' });
          expect(client).toBe(mainClient); // Assert that the main client was retrieved.
          expect(client!.getAttributes()).toEqual({ att1: 'att1' }); // Assert that the client was retrieved with the provided attributes.
          countUseSplitClient++;
          return null;
        })}
        {React.createElement(() => {
          const { client } = useSplitClient('user_2');
          expect(client).toBe(user2Client);
          countUseSplitClientUser2++;
          return null;
        })}
        <SplitClient splitKey={sdkBrowser.core.key} updateOnSdkUpdate={true} >
          {() => { countSplitClientWithUpdate++; return null }}
        </SplitClient>
        {React.createElement(() => {
          useSplitClient(sdkBrowser.core.key, sdkBrowser.core.trafficType, undefined, { updateOnSdkUpdate: true }).client;
          countUseSplitClientWithUpdate++;
          return null;
        })}
        <SplitClient splitKey={'user_2'} updateOnSdkUpdate={true}>
          {() => { countSplitClientUser2WithUpdate++; return null }}
        </SplitClient>
        {React.createElement(() => {
          useSplitClient('user_2', undefined, undefined, { updateOnSdkUpdate: true });
          countUseSplitClientUser2WithUpdate++;
          return null;
        })}
        <SplitClient splitKey={'user_2'} updateOnSdkUpdate={true}>
          {React.createElement(() => {
            const status = useSplitClient('user_2', undefined, undefined, { updateOnSdkUpdate: true });
            countNestedComponent++;

            expect(status.client).toBe(user2Client);
            switch (countNestedComponent) {
              case 1:
              case 2:
                expect(status.isReady).toBe(false);
                expect(status.isReadyFromCache).toBe(false);
                break;
              case 3:
              case 4:
                expect(status.isReady).toBe(false);
                expect(status.isReadyFromCache).toBe(true);
                break;
              case 5:
              case 6:
                expect(status.isReady).toBe(true);
                expect(status.isReadyFromCache).toBe(true);
                break;
              default:
                throw new Error('Unexpected render');
            }
            return null;
          })}
        </SplitClient>
      </>
    </SplitFactory>
  );

  act(() => mainClient.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
  act(() => user2Client.__emitter__.emit(Event.SDK_READY_FROM_CACHE));
  await new Promise(resolve => setTimeout(resolve, 10));
  act(() => mainClient.__emitter__.emit(Event.SDK_READY));
  act(() => user2Client.__emitter__.emit(Event.SDK_READY));
  await new Promise(resolve => setTimeout(resolve, 10));
  act(() => mainClient.__emitter__.emit(Event.SDK_UPDATE));
  act(() => user2Client.__emitter__.emit(Event.SDK_UPDATE));

  // SplitContext renders 3 times: initially, when ready from cache, and when ready.
  expect(countSplitContext).toEqual(3);

  // If SplitClient and useSplitClient retrieve the same client than the context and have default update options,
  // they render when the context renders.
  expect(countSplitClient).toEqual(countSplitContext);
  expect(countUseSplitClient).toEqual(countSplitContext);

  // If SplitClient and useSplitClient retrieve a different client than the context and have default update options,
  // they render when the context renders and when the new client is ready and ready from cache.
  expect(countSplitClientUser2).toEqual(countSplitContext + 2);
  expect(countUseSplitClientUser2).toEqual(countSplitContext + 2);

  // If SplitClient and useSplitClient retrieve the same client than the context and have updateOnSdkUpdate = true,
  // they render when the context renders and when the client updates.
  expect(countSplitClientWithUpdate).toEqual(countSplitContext + 1);
  expect(countUseSplitClientWithUpdate).toEqual(countSplitContext + 1);

  // If SplitClient and useSplitClient retrieve a different client than the context and have updateOnSdkUpdate = true,
  // they render when the context renders and when the new client is ready, ready from cache and updates.
  expect(countSplitClientUser2WithUpdate).toEqual(countSplitContext + 3);
  expect(countUseSplitClientUser2WithUpdate).toEqual(countSplitContext + 3);

  // @TODO This is because useSplitClient inside SplitClient renders twice per SDK event
  expect(countNestedComponent).toEqual(6);
});
