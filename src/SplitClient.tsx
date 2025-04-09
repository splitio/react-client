import * as React from 'react';
import { SplitContext } from './SplitContext';
import { ISplitClientProps } from './types';
import { useSplitClient } from './useSplitClient';

/**
 * SplitClient will initialize a new SDK client and listen for its events in order to update the Split Context.
 * Children components will have access to the new client when accessing Split Context.
 *
 * The underlying SDK client can be changed during the component lifecycle
 * if the component is updated with a different splitKey prop.
 *
 * @deprecated `SplitClient` will be removed in a future major release. We recommend replacing it with the `useSplitClient` hook.
 */
export function SplitClient(props: ISplitClientProps) {
  const { children } = props;
  const context = useSplitClient(props);

  return (
    <SplitContext.Provider value={{
      ...context,
      updateOnSdkReady: props.updateOnSdkReady,
      updateOnSdkReadyFromCache: props.updateOnSdkReadyFromCache,
      updateOnSdkTimedout: props.updateOnSdkTimedout,
      updateOnSdkUpdate: props.updateOnSdkUpdate
    }}>
      {
        typeof children === 'function' ?
          children(context) :
          children
      }
    </SplitContext.Provider>
  )
}
