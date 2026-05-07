import { map } from 'lodash';
import { exhaustive } from '@freckle/exhaustive';
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
        const strings = map(path, component => {
            switch (component.tag) {
                case 'index':
                    return component.index.toString();
                case 'key':
                    return component.key;
                default:
                    return exhaustive(component, 'PathComponentT');
            }
        });
        return strings.length === 0 ? null : strings.join('.');
    }
};
export default Path;
