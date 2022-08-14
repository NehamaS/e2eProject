"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scenario_validation_1 = require("./validation/scenario-validation");
var step_definition_validation_1 = require("./validation/step-definition-validation");
var tag_filtering_1 = require("./tag-filtering");
var processScenarioTitleTemplate = function (scenarioTitle, parsedFeature, options, parsedScenario, parsedScenarioOutline) {
    if (options && options.scenarioNameTemplate) {
        try {
            return options && options.scenarioNameTemplate({
                featureTitle: parsedFeature.title,
                scenarioTitle: scenarioTitle.toString(),
                featureTags: parsedFeature.tags,
                scenarioTags: (parsedScenario || parsedScenarioOutline).tags,
            });
        }
        catch (err) {
            throw new Error(
            // tslint:disable-next-line:max-line-length
            "An error occurred while executing a scenario name template. \nTemplate:\n" + options.scenarioNameTemplate + "\nError:" + err.message);
        }
    }
    return scenarioTitle;
};
var checkForPendingSteps = function (scenarioFromStepDefinitions) {
    var scenarioPending = false;
    scenarioFromStepDefinitions.steps.forEach(function (step) {
        try {
            if (step.stepFunction.toString().indexOf('pending()') !== -1) {
                var pendingTest = new Function("\n                    let isPending = false;\n\n                    const pending = function () {\n                        isPending = true;\n                    };\n\n                    (" + step.stepFunction + ")();\n\n                    return isPending;\n                ");
                scenarioPending = pendingTest();
            }
        }
        catch (err) {
            // Ignore
        }
    });
    return scenarioPending;
};
var getTestFunction = function (skippedViaTagFilter, only, skip, concurrent) {
    if (skip || skippedViaTagFilter) {
        return test.skip;
    }
    else if (only) {
        return test.only;
    }
    else if (concurrent) {
        return test.concurrent;
    }
    else {
        return test;
    }
};
var defineScenario = function (scenarioTitle, scenarioFromStepDefinitions, parsedScenario, only, skip, concurrent) {
    if (only === void 0) { only = false; }
    if (skip === void 0) { skip = false; }
    if (concurrent === void 0) { concurrent = false; }
    var testFunction = getTestFunction(parsedScenario.skippedViaTagFilter, only, skip, concurrent);
    testFunction(scenarioTitle, function () {
        return scenarioFromStepDefinitions.steps.reduce(function (promiseChain, nextStep, index) {
            var stepArgument = parsedScenario.steps[index].stepArgument;
            var matches = step_definition_validation_1.matchSteps(parsedScenario.steps[index].stepText, scenarioFromStepDefinitions.steps[index].stepMatcher);
            var matchArgs = [];
            if (matches && matches.length) {
                matchArgs = matches.slice(1);
            }
            var args = matchArgs.concat([stepArgument]);
            return promiseChain.then(function () { return nextStep.stepFunction.apply(nextStep, args); });
        }, Promise.resolve());
    });
};
var createDefineScenarioFunction = function (featureFromStepDefinitions, parsedFeature, only, skip, concurrent) {
    if (only === void 0) { only = false; }
    if (skip === void 0) { skip = false; }
    if (concurrent === void 0) { concurrent = false; }
    var defineScenarioFunction = function (scenarioTitle, stepsDefinitionFunctionCallback) {
        var scenarioFromStepDefinitions = {
            title: scenarioTitle,
            steps: [],
        };
        featureFromStepDefinitions.scenarios.push(scenarioFromStepDefinitions);
        stepsDefinitionFunctionCallback({
            defineStep: createDefineStepFunction(scenarioFromStepDefinitions),
            given: createDefineStepFunction(scenarioFromStepDefinitions),
            when: createDefineStepFunction(scenarioFromStepDefinitions),
            then: createDefineStepFunction(scenarioFromStepDefinitions),
            and: createDefineStepFunction(scenarioFromStepDefinitions),
            but: createDefineStepFunction(scenarioFromStepDefinitions),
            pending: function () {
                // Nothing to do
            },
        });
        var parsedScenario = parsedFeature.scenarios
            .filter(function (s) { return s.title.toLowerCase() === scenarioTitle.toLowerCase(); })[0];
        var parsedScenarioOutline = parsedFeature.scenarioOutlines
            .filter(function (s) { return s.title.toLowerCase() === scenarioTitle.toLowerCase(); })[0];
        var options = parsedFeature.options;
        scenarioTitle = processScenarioTitleTemplate(scenarioTitle, parsedFeature, options, parsedScenario, parsedScenarioOutline);
        step_definition_validation_1.ensureFeatureFileAndStepDefinitionScenarioHaveSameSteps(options, parsedScenario || parsedScenarioOutline, scenarioFromStepDefinitions);
        if (checkForPendingSteps(scenarioFromStepDefinitions)) {
            xtest(scenarioTitle, function () {
                // Nothing to do
            }, undefined);
        }
        else if (parsedScenario) {
            defineScenario(scenarioTitle, scenarioFromStepDefinitions, parsedScenario, only, skip, concurrent);
        }
        else if (parsedScenarioOutline) {
            parsedScenarioOutline.scenarios.forEach(function (scenario) {
                defineScenario((scenario.title || scenarioTitle), scenarioFromStepDefinitions, scenario, only, skip, concurrent);
            });
        }
    };
    return defineScenarioFunction;
};
var createDefineScenarioFunctionWithAliases = function (featureFromStepDefinitions, parsedFeature) {
    var defineScenarioFunctionWithAliases = createDefineScenarioFunction(featureFromStepDefinitions, parsedFeature);
    defineScenarioFunctionWithAliases.only = createDefineScenarioFunction(featureFromStepDefinitions, parsedFeature, true);
    defineScenarioFunctionWithAliases.skip = createDefineScenarioFunction(featureFromStepDefinitions, parsedFeature, false, true);
    defineScenarioFunctionWithAliases.concurrent = createDefineScenarioFunction(featureFromStepDefinitions, parsedFeature, false, false, true);
    return defineScenarioFunctionWithAliases;
};
var createDefineStepFunction = function (scenarioFromStepDefinitions) {
    return function (stepMatcher, stepFunction) {
        var stepDefinition = {
            stepMatcher: stepMatcher,
            stepFunction: stepFunction,
        };
        scenarioFromStepDefinitions.steps.push(stepDefinition);
    };
};
function defineFeature(featureFromFile, scenariosDefinitionCallback) {
    var featureFromDefinedSteps = {
        title: featureFromFile.title,
        scenarios: [],
    };
    var parsedFeatureWithTagFiltersApplied = tag_filtering_1.applyTagFilters(featureFromFile);
    if (parsedFeatureWithTagFiltersApplied.scenarios.length === 0
        && parsedFeatureWithTagFiltersApplied.scenarioOutlines.length === 0) {
        return;
    }
    describe(featureFromFile.title, function () {
        scenariosDefinitionCallback(createDefineScenarioFunctionWithAliases(featureFromDefinedSteps, parsedFeatureWithTagFiltersApplied));
        scenario_validation_1.checkThatFeatureFileAndStepDefinitionsHaveSameScenarios(parsedFeatureWithTagFiltersApplied, featureFromDefinedSteps);
    });
}
exports.defineFeature = defineFeature;
//# sourceMappingURL=feature-definition-creation.js.map