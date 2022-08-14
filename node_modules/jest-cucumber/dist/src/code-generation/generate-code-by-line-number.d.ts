import { ParsedFeature } from '../models';
export declare enum ObjectTypeEnum {
    scenario = 0,
    scenarioOutline = 1,
    step = 2
}
export declare const generateCodeFromFeature: (feature: ParsedFeature, lineNumber: number) => string | null | undefined;
export declare const generateCodeWithSeparateFunctionsFromFeature: (feature: ParsedFeature, lineNumber: number) => string | null | undefined;
