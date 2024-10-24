import React from 'react';
import { ISplitContextValues } from './types';
import { EXCEPTION_NO_SFP } from './constants';

/**
 * Split Context is the React Context instance that represents our SplitIO global state.
 * It contains Split SDK objects, such as a factory instance, a client and its status (isReady, isTimedout, lastUpdate)
 * The context is created with default empty values, that SplitFactoryProvider and SplitClient access and update.
 */
export const SplitContext = React.createContext<ISplitContextValues | undefined>(undefined);

/**
 * Hook to access the value of `SplitContext`.
 *
 * @returns The Split Context object value
 * @throws Throws an error if the Split Context is not set (i.e. the component is not wrapped in a SplitFactoryProvider)
 */
export function useSplitContext() {
  const context = React.useContext(SplitContext);

  if (!context) throw new Error(EXCEPTION_NO_SFP)

  return context;
}
