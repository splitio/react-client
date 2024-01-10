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
export const WARN_SF_CONFIG_AND_FACTORY: string = '[WARN]  Both a config and factory props were provided to SplitFactoryProvider. Config prop will be ignored.';

// @TODO remove with SplitFactory component in next major version
export const ERROR_SF_NO_CONFIG_AND_FACTORY: string = '[ERROR] SplitFactory must receive either a Split config or a Split factory as props.';

export const EXCEPTION_NO_REACT_OR_CREATECONTEXT: string = 'React library is not available or its version is not supported. Check that it is properly installed or imported. Split SDK requires version 16.3.0+ of React.';

export const WARN_NAMES_AND_FLAGSETS: string = '[WARN]  Both names and flagSets properties were provided. flagSets will be ignored.';
