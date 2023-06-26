import React from 'react';
import { ISplitContextValues } from './types';
export declare const INITIAL_CONTEXT: ISplitContextValues;
/**
 * Split Context is the React Context instance that represents our SplitIO global state.
 * It contains Split SDK objects, such as a factory instance, a client and its status (isReady, isTimedout, lastUpdate)
 * The context is created with default empty values, that eventually SplitFactory and SplitClient access and update.
 */
export declare const SplitContext: React.Context<ISplitContextValues>;
