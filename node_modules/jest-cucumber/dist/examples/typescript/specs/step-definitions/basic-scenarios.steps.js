"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../../../../src/");
var rocket_1 = require("../../src/rocket");
var feature = src_1.loadFeature('./examples/typescript/specs/features/basic-scenarios.feature');
src_1.defineFeature(feature, function (test) {
    test('Launching a SpaceX rocket', function (_a) {
        var given = _a.given, when = _a.when, then = _a.then;
        var rocket;
        given('I am Elon Musk attempting to launch a rocket into space', function () {
            rocket = new rocket_1.Rocket();
        });
        when('I launch the rocket', function () {
            rocket.launch();
        });
        then('the rocket should end up in space', function () {
            expect(rocket.isInSpace).toBe(true);
        });
        then('the booster(s) should land back on the launch pad', function () {
            expect(rocket.boostersLanded).toBe(true);
        });
        then('nobody should doubt me ever again', function () {
            expect('people').not.toBe('haters');
        });
    });
});
//# sourceMappingURL=basic-scenarios.steps.js.map