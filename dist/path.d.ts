declare type PathComponentT = {
    tag: 'index';
    index: number;
} | {
    tag: 'key';
    key: string;
};
export declare type PathT = Array<PathComponentT>;
declare const Path: {
    root(): PathT;
    skip(): PathT;
    index(path: PathT, index: number): PathT;
    key(path: PathT, key: string): PathT;
    join(path: PathT): string | undefined | null;
};
export default Path;
