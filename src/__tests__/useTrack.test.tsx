import React from 'react';
import { render } from '@testing-library/react';

/** Mocks */
import { mockSdk } from './testUtils/mockSplitSdk';
jest.mock('@splitsoftware/splitio/client', () => {
  return { SplitFactory: mockSdk() };
});
import { SplitFactory as SplitSdk } from '@splitsoftware/splitio/client';
import { sdkBrowser } from './testUtils/sdkConfigs';

/** Test target */
import { SplitFactory } from '../SplitFactory';
import { SplitClient } from '../SplitClient';
import { useTrack } from '../useTrack';

describe('useTrack', () => {

  const tt = 'user';
  const eventType = 'eventType';
  const value = 10;
  const properties = { prop1: 'prop1' };

  test('returns the track method binded to the client at Split context updated by SplitFactory.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let bindedTrack;
    let trackResult;

    render(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          bindedTrack = useTrack();
          trackResult = bindedTrack(tt, eventType, value, properties);
          return null;
        })}</SplitFactory>,
    );
    const track = outerFactory.client().track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method binded to the client at Split context updated by SplitClient.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let bindedTrack;
    let trackResult;

    render(
      <SplitFactory factory={outerFactory} >
        <SplitClient splitKey='user2' >{
          React.createElement(() => {
            bindedTrack = useTrack();
            trackResult = bindedTrack(tt, eventType, value, properties);
            return null;
          })}
        </SplitClient>
      </SplitFactory>,
    );
    const track = outerFactory.client('user2').track as jest.Mock;
    expect(track).toBeCalledWith(tt, eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  test('returns the track method binded to a new client given a splitKey and optional trafficType.', () => {
    const outerFactory = SplitSdk(sdkBrowser);
    let bindedTrack;
    let trackResult;

    render(
      <SplitFactory factory={outerFactory} >{
        React.createElement(() => {
          bindedTrack = useTrack('user2', tt);
          trackResult = bindedTrack(eventType, value, properties);
          return null;
        })}
      </SplitFactory>,
    );
    const track = outerFactory.client('user2', tt).track as jest.Mock;
    expect(track).toBeCalledWith(eventType, value, properties);
    expect(track).toHaveReturnedWith(trackResult);
  });

  // THE FOLLOWING TEST WILL PROBABLE BE CHANGED BY 'return a null value or throw an error if it is not inside an SplitProvider'
  test('returns a false function (`() => false`) if invoked outside Split context.', () => {
    let trackResult;
    render(
      React.createElement(
        () => {
          const track = useTrack('user2', tt);
          trackResult = track(eventType, value, properties);
          return null;
        }),
    );
    expect(trackResult).toBe(false);
  });

});
