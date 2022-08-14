"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rocket = /** @class */ (function () {
    function Rocket() {
        this.isInSpace = false;
        this.boostersLanded = true;
    }
    Rocket.prototype.launch = function () {
        this.isInSpace = true;
        this.boostersLanded = true;
    };
    return Rocket;
}());
exports.Rocket = Rocket;
//# sourceMappingURL=rocket.js.map