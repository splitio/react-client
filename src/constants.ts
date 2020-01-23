import { Treatment, TreatmentWithConfig } from '@splitsoftware/splitio/types/splitio';
// The string below is a marker and will be replaced by the real version number. DO NOT CHANGE
export const VERSION: string = 'react-' + 'REACT_SDK_VERSION_NUMBER';

// Treatments
export const ON: Treatment = 'on';

export const OFF: Treatment = 'off';

export const CONTROL: Treatment = 'control'; // SplitIO default value

export const CONTROL_WITH_CONFIG: TreatmentWithConfig = {
  treatment: 'control', // SplitIO default value
  config: null,
};

export const getControlTreatmentsWithConfig = (splitNames: string[]): SplitIO.TreatmentsWithConfig => {
  return splitNames.reduce((pValue: SplitIO.TreatmentsWithConfig, cValue: string) => {
    pValue[cValue] = CONTROL_WITH_CONFIG;
    return pValue;
  }, {});
};

// Warning and error messages
export const WARN_SF_CONFIG_AND_FACTORY: string = '[WARN] Both a config and factory props were provided to SplitFactory. Config prop will be ignored.';

export const ERROR_SF_NO_CONFIG_AND_FACTORY: string = '[ERROR] SplitFactory must receive either a Split config or a Split factory as props.';

export const ERROR_SC_NO_FACTORY: string = '[ERROR] SplitClient does not have access to a Split factory. This is because it is not inside the scope of a SplitFactory component or SplitFactory was not properly instantiated.';

export const WARN_ST_NO_CLIENT: string = '[WARN] SplitTreatments does not have access to a Split client. This is because it is not inside the scope of a SplitFactory component or SplitFactory was not properly instantiated.';
