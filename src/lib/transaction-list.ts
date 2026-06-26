export const TX_PAGE_SIZE_DEFAULT = 50;
export const TX_PAGE_SIZE_MAX = 200;
/** Safety cap when loading full history for a single user. */
export const TX_SCOPED_ALL_MAX = 10_000;

export type TransactionPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  truncated: boolean;
};

export type ParsedTransactionListParams = {
  page: number;
  pageSize: number;
  /** When true, return every row for a scoped user query (up to TX_SCOPED_ALL_MAX). */
  fetchAll: boolean;
};

export function parseTransactionListParams(
  searchParams: URLSearchParams,
  scopedToUser: boolean,
): ParsedTransactionListParams {
  const allParam = searchParams.get("all");
  const fetchAll =
    scopedToUser &&
    (allParam === null || allParam === "1" || allParam === "true");

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const pageSize = Math.min(
    TX_PAGE_SIZE_MAX,
    Math.max(
      1,
      Number.parseInt(
        searchParams.get("pageSize") ?? String(TX_PAGE_SIZE_DEFAULT),
        10,
      ) || TX_PAGE_SIZE_DEFAULT,
    ),
  );

  return { page, pageSize, fetchAll };
}

export function buildTransactionPagination(args: {
  total: number;
  page: number;
  pageSize: number;
  returned: number;
  fetchAll: boolean;
  truncated: boolean;
}): TransactionPagination {
  const { total, page, pageSize, returned, fetchAll, truncated } = args;
  const totalPages = fetchAll
    ? 1
    : Math.max(1, Math.ceil(total / pageSize));
  const hasMore = fetchAll ? truncated : page < totalPages;

  return {
    page: fetchAll ? 1 : page,
    pageSize: fetchAll ? returned : pageSize,
    total,
    totalPages,
    hasMore,
    truncated,
  };
}
