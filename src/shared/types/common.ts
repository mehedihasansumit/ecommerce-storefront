export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  sort?: string;
  order?: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
