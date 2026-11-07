/** The product as shoppers may see it: the cost price (what the store paid) removed. */
export function withoutCost<T extends { costPrice?: number }>(product: T): Omit<T, "costPrice"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { costPrice, ...rest } = product;
  return rest;
}
