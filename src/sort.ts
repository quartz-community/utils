import type { QuartzPluginData, ValidDateType, SortFn } from "@quartz-community/types";

export function getDate(data: QuartzPluginData): Date | undefined {
  const defaultDateType = data.defaultDateType as ValidDateType | undefined;
  if (!defaultDateType) {
    throw new Error(
      "Field 'defaultDateType' was not set. Ensure the CreatedModifiedDate plugin is configured with a 'defaultDateType' option.",
    );
  }
  const dates = data.dates as Record<ValidDateType, Date> | undefined;
  return dates?.[defaultDateType];
}

export function byDateAndAlphabetical(): SortFn {
  return (f1, f2) => {
    const f1Dates = f1.dates as Record<string, Date> | undefined;
    const f2Dates = f2.dates as Record<string, Date> | undefined;
    if (f1Dates && f2Dates) {
      return getDate(f2)!.getTime() - getDate(f1)!.getTime();
    } else if (f1Dates && !f2Dates) {
      return -1;
    } else if (!f1Dates && f2Dates) {
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
