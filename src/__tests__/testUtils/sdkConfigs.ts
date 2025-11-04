export const sdkBrowser: SplitIO.IBrowserSettings = {
  core: {
    authorizationKey: 'sdk-key',
    key: 'customer-key',
  },
};

export const sdkBrowserWithConfig: SplitIO.IBrowserSettings = {
  ...sdkBrowser,
  fallbackTreatments: {
    global: 'control_global',
    byFlag: { ff1: { treatment: 'control_ff1', config: 'control_ff1_config' } }
  }
};
