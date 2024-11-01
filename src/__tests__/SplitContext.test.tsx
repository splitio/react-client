import React from 'react';
import { render } from '@testing-library/react';
import { SplitContext } from '../SplitContext';
import { SplitFactoryProvider } from '../SplitFactoryProvider';
import { INITIAL_STATUS } from './testUtils/utils';

/**
 * Test default SplitContext value
 */
test('SplitContext.Consumer shows default value', () => {
  render(
    <SplitContext.Consumer>
      {(value) => {
        expect(value).toBe(undefined);
        return null;
      }}
    </SplitContext.Consumer>
  );
});

test('SplitContext.Consumer shows value when wrapped in a SplitFactoryProvider', () => {
  render(
    <SplitFactoryProvider >
      <SplitContext.Consumer>
        {(value) => {
          expect(value).toEqual({
            ...INITIAL_STATUS,
            factory: undefined,
            client: undefined
          });
          return null;
        }}
      </SplitContext.Consumer>
    </SplitFactoryProvider>
  );
});
