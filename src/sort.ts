import type { QuartzPluginData, ValidDateType, SortFn } from "@quartz-community/types";

export function getDate(data: QuartzPluginData): Date | undefined {
  const defaultDateType = data.defaultDateType as ValidDateType | undefined;
  if (!defaultDateType) {
    return undefined;
  }
  const dates = data.dates as Record<ValidDateType, Date> | undefined;
  return dates?.[defaultDateType];
}

export function byDateAndAlphabetical(): SortFn {
  return (f1, f2) => {
    const f1Date = getDate(f1);
    const f2Date = getDate(f2);
    if (f1Date && f2Date) {
      return f2Date.getTime() - f1Date.getTime();
    } else if (f1Date && !f2Date) {
      return -1;
    } else if (!f1Date && f2Date) {
      return 1;
    }

    const f1Title = (
      ((f1.frontmatter as Record<string, unknown>)?.title as string) ?? ""
    ).toLowerCase();
    const f2Title = (
      ((f2.frontmatter as Record<string, unknown>)?.title as string) ?? ""
    ).toLowerCase();
    return f1Title.localeCompare(f2Title);
  };
}
