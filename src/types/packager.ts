import {
    Plugin,
    TransformResult as RollupTransformResult,
    ResolveIdResult as RollupResolveIdResult,
    LoadResult as RollupLoadResult
} from "rollup";
import QueueSystem from "@shared/queue-system";
import { ApplicationCache } from "@shared/application-cache";

export type PackagerOptions = {
    sourcemaps: boolean;
};

export type File = {
    name: string;
    path: string;
    entry: boolean;
    code: string;
};

export type PackagerContext = {
    cache: {
        dependencies: ApplicationCache;
        transpilers: ApplicationCache;
        esModulesWithDefaultExport: any;
        esModulesWithoutDefaultExport: any;
    };
    transpileQueue: QueueSystem;
    files: File[];
    bundleOptions: BundleOptions;
};

export type BundleOptions = {
    dependencies: { [moduleName: string]: string };
};

export interface Transformer extends Plugin {}
export interface Resolver extends Plugin {}
export interface Loader extends Plugin {}
export interface Setup extends Plugin {}
export type TransformResult = RollupTransformResult;
export type ResolveResult = RollupResolveIdResult;
export type LoadResult = RollupLoadResult;