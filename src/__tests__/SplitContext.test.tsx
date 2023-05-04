import React from 'react';
import { render } from '@testing-library/react';
import { SplitContext } from '../SplitContext';

/**
 * Test default SplitContext value
 */
test('SplitContext.Consumer shows default value', () => {
  render(<SplitContext.Consumer>{(value) => {
    expect(value.factory).toBe(null);
    expect(value.client).toBe(null);
    expect(value.isReady).toBe(false);
    expect(value.isReadyFromCache).toBe(false);
    expect(value.hasTimedout).toBe(false);
    expect(value.isTimedout).toBe(false);
    expect(value.isDestroyed).toBe(false);
    expect(value.lastUpdate).toBe(0);
    return null;
  }}</SplitContext.Consumer>);
});
