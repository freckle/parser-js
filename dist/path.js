"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const map_1 = __importDefault(require("lodash/map"));
const exhaustive_js_1 = require("@freckle/exhaustive-js");
const Path = {
    root() {
        return [];
    },
    // For "invisible" components, e.g. nullable
    skip() {
        return [];
    },
    // Push an index on the end of a path
    index(path, index) {
        return [...path, { tag: 'index', index }];
    },
    // Push a key on the end of a path
    key(path, key) {
        return [...path, { tag: 'key', key }];
    },
    // Convert a Path into a string representation
    join(path) {
        const strings = (0, map_1.default)(path, component => {
            switch (component.tag) {
                case 'index':
                    return component.index.toString();
                case 'key':
                    return component.key;
                default:
                    return (0, exhaustive_js_1.exhaustive)(component, 'PathComponentT');
            }
        });
        return strings.length === 0 ? null : strings.join('.');
    }
};
exports.default = Path;
