"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var stepTemplate = function (stepKeyword, stepMatcher, stepArgumentVariables) {
    return stepKeyword + "(" + stepMatcher + ", (" + stepArgumentVariables.join(', ') + ") => {\n\n});";
};
var getStepFunctionWrapperName = function (stepKeyword, stepText) {
    // tslint:disable-next-line:max-line-length
    return stepKeyword + "_" + stepText.replace(stepTextArgumentRegex, 'X').replace(/\s/g, '_').replace(/[^A-Za-z0-9_]/g, '');
};
var stepWrapperFunctionTemplate = function (stepKeyword, stepText, stepMatcher, stepArgumentVariables) {
    // tslint:disable-next-line:max-line-length
    return "export const " + getStepFunctionWrapperName(stepKeyword, stepText) + " = (" + stepKeyword + ") => {\n" + utils_1.indent(stepTemplate(stepKeyword, stepMatcher, stepArgumentVariables), 1).slice(0, -1) + "\n}";
};
var stepWrapperFunctionCallTemplate = function (stepText, stepKeyword) {
    return getStepFunctionWrapperName(stepKeyword, stepText) + "(" + stepKeyword + ")";
};
var stepTextArgumentRegex = /([-+]?[0-9]*\.?[0-9]+|\"(.+)\"|\"?\<(.*)\>\"?)/g;
var escapeRegexCharacters = function (text) {
    return text
        .replace(/\$/g, '\\$')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
};
var convertStepTextToRegex = function (step) {
    var stepText = escapeRegexCharacters(step.stepText);
    var match;
    while (match = stepTextArgumentRegex.exec(stepText)) {
        stepText = stepText.replace(new RegExp(match[1], 'g'), '(.*)');
    }
    return "/^" + stepText + "$/";
};
var getStepArguments = function (step) {
    var stepArgumentVariables = [];
    var match;
    var index = 0;
    while (match = stepTextArgumentRegex.exec(step.stepText)) {
        stepArgumentVariables.push("arg" + index);
        index++;
    }
    if (step.stepArgument) {
        if (typeof step.stepArgument === 'string') {
            stepArgumentVariables.push('docString');
        }
        else {
            stepArgumentVariables.push('table');
        }
    }
    return stepArgumentVariables;
};
var getStepMatcher = function (step) {
    var stepMatcher = '';
    if (step.stepText.match(stepTextArgumentRegex)) {
        stepMatcher = convertStepTextToRegex(step);
    }
    else {
        stepMatcher = "'" + step.stepText.replace(/'+/g, "\\'") + "'";
    }
    return stepMatcher;
};
exports.getStepKeyword = function (steps, stepPosition) {
    return steps[stepPosition].keyword;
};
exports.generateStepCode = function (steps, stepPosition, generateWrapperFunction) {
    if (generateWrapperFunction === void 0) { generateWrapperFunction = false; }
    var step = steps[stepPosition];
    var stepKeyword = exports.getStepKeyword(steps, stepPosition);
    var stepMatcher = getStepMatcher(step);
    var stepArguments = getStepArguments(step);
    if (generateWrapperFunction) {
        return stepWrapperFunctionTemplate(stepKeyword, step.stepText, stepMatcher, stepArguments);
    }
    else {
        return stepTemplate(stepKeyword, stepMatcher, stepArguments);
    }
};
exports.generateStepFunctionCall = function (steps, stepPosition) {
    var step = steps[stepPosition];
    var stepKeyword = exports.getStepKeyword(steps, stepPosition);
    return stepWrapperFunctionCallTemplate(step.stepText, stepKeyword);
};
//# sourceMappingURL=step-generation.js.map