import type { IStore } from "./types";

/**
 * The store as the storefront may hold it: payment secrets removed. The tenant is
 * cached on the server's disk and passed to client components (it ends up in the
 * page HTML), so the Stripe secret key and SSLCommerz password must never be in it.
 * Payment code that needs them reads the store from StoreService directly.
 */
export function toPublicStore(store: IStore): IStore {
  if (!store.payment) return store;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { stripeSecretKey, sslcommerzStorePassword, ...payment } = store.payment;
  return { ...store, payment: payment as IStore["payment"] };
}
