export const TextFilterConditions = {
  CONTAINS: "contains", 
  DOES_NOT_CONTAIN: "does not contain", 
  IS_EQUAL_TO: "is equal to", 
  IS_EMPTY: "is empty", 
  IS_NOT_EMPTY: "is not empty"
} as const;

export interface FilterType {
  column: string;
  condition: string;
  value?: string | undefined;
}

export const TextSortConditions = {
  ALPHA: "A → Z", 
  ALPHA_REVERSE: "Z → A",
} as const;

export const NumSortConditions = {
  INC: "1 → 9", 
  DEC: "9 → 1", 
} as const;

export interface SortType {
  column: string,
  order: string,
}