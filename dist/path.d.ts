import { FullSlug, FilePath } from '@quartz-community/types';
export { FilePath, FullSlug } from '@quartz-community/types';

/** No '/index' ending, no file extension, can have trailing slash for folders. */
type SimpleSlug = string & {
    _brand: "SimpleSlug";
};
/** Starts with './' or '../', used for navigation. */
type RelativeURL = string & {
    _brand: "RelativeURL";
};
interface TransformOptions {
    strategy: "absolute" | "relative" | "shortest";
    allSlugs: FullSlug[];
}
declare function isFilePath(s: string): s is FilePath;
declare function isFullSlug(s: string): s is FullSlug;
declare function isSimpleSlug(s: string): s is SimpleSlug;
declare function isRelativeURL(s: string): s is RelativeURL;
declare function isAbsoluteURL(s: string): boolean;
declare function simplifySlug(fp: FullSlug | string): SimpleSlug;
declare function getFullSlug(window: Window): FullSlug;
declare function getFullSlugFromUrl(): FullSlug;
declare function slugifyFilePath(fp: FilePath, excludeExt?: boolean): FullSlug;
declare function joinSegments(...args: string[]): string;
declare function resolvePath(to: string): string;
/** Read the base path injected at build time via `data-basepath` on `<body>`.
 *  Returns `""` for root deployments, e.g. `"/repository"` for subdirectory. */
declare function getBasePath(): string;
/** Resolve a slug to an absolute URL path, prepending the site's base path.
 *  e.g. `resolveBasePath("features/Callouts")` → `"/repository/features/Callouts"` */
declare function resolveBasePath(to: string, basePath?: string): string;
declare function endsWith(s: string, suffix: string): boolean;
declare function trimSuffix(s: string, suffix: string): string;
declare function stripSlashes(s: string, onlyStripPrefix?: boolean): string;
declare function getFileExtension(s: string): string | undefined;
declare function isFolderPath(fplike: string): boolean;
declare function getAllSegmentPrefixes(path: string): string[];
declare function pathToRoot(slug: FullSlug): RelativeURL;
declare function resolveRelative(current: FullSlug, target: FullSlug | SimpleSlug): RelativeURL;
declare function splitAnchor(link: string): [string, string];
declare function slugTag(tag: string): string;
declare function transformInternalLink(link: string): RelativeURL;
declare function transformLink(src: FullSlug, target: string, opts: TransformOptions): RelativeURL;

export { type RelativeURL, type SimpleSlug, type TransformOptions, endsWith, getAllSegmentPrefixes, getBasePath, getFileExtension, getFullSlug, getFullSlugFromUrl, isAbsoluteURL, isFilePath, isFolderPath, isFullSlug, isRelativeURL, isSimpleSlug, joinSegments, pathToRoot, resolveBasePath, resolvePath, resolveRelative, simplifySlug, slugTag, slugifyFilePath, splitAnchor, stripSlashes, transformInternalLink, transformLink, trimSuffix };
