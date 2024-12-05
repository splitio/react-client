import * as React from 'react';
import { ISplitContextValues } from './types';
import { EXCEPTION_NO_SFP } from './constants';

/**
 * Split Context is the React Context instance provided by the SplitFactoryProvider and consumed by the Split Hooks.
 * It is used to share the SDK factory instance and other values across the application.
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
