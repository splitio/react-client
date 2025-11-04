// The string below is a marker and will be replaced by the real version number. DO NOT CHANGE
export const VERSION: string = 'react-' + 'REACT_SDK_VERSION_NUMBER';

// Treatments
export const ON: SplitIO.Treatment = 'on';

export const OFF: SplitIO.Treatment = 'off';

export const CONTROL: SplitIO.Treatment = 'control'; // SplitIO default value

export const CONTROL_WITH_CONFIG: SplitIO.TreatmentWithConfig = {
  treatment: 'control', // SplitIO default value
  config: null,
};

// Warning and error messages
export const WARN_SF_CONFIG_AND_FACTORY: string = 'Both a config and factory props were provided to SplitFactoryProvider. Config prop will be ignored.';

export const EXCEPTION_NO_SFP: string = 'No SplitContext was set. Please ensure the component is wrapped in a SplitFactoryProvider.';
