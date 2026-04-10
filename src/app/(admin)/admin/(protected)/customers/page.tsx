import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthService } from "@/features/auth/service";
import { StoreService } from "@/features/stores/service";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";
import { Users, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Customers" };

const PAGE_SIZE = 10;

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function AllCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; store?: string }>;
}) {
  const payload = (await getAdminToken()) as JwtAdminPayload | null;
  if (!payload || !hasPermission(payload, PERMISSIONS.CUSTOMERS_VIEW)) redirect("/admin");

  const { page: pageStr, store: storeFilter } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [{ customers, total }, stores] = await Promise.all([
    AuthService.getAllCustomers({ page, limit: PAGE_SIZE, storeId: storeFilter }),
    StoreService.getAll(),
  ]);

  const storeMap = new Map(stores.map((s) => [s._id, s]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function buildHref(p: number, store?: string) {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    if (store) sp.set("store", store);
    return `?${sp.toString()}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {total === 1 ? "customer" : "customers"}
            {storeFilter ? " in this store" : " across all stores"}
          </p>
        </div>
      </div>

      {/* Store filter tabs */}
      {stores.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <Link
            href="?"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!storeFilter
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
          >
            All Stores
          </Link>
          {stores.map((s) => (
            <Link
              key={s._id}
              href={buildHref(1, s._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${storeFilter === s._id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No customers yet</h3>
          <p className="text-sm text-gray-500">Customers will appear here once they register.</p>
        </div>
      ) : (
        <>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(Math.max(1, currentPage - 1), storeFilter)}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-500 transition-colors ${currentPage <= 1
                      ? "opacity-30 pointer-events-none border-gray-200"
                      : "border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(item as number, storeFilter)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${currentPage === item
                            ? "bg-gray-900 text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(Math.min(totalPages, currentPage + 1), storeFilter)}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-500 transition-colors ${currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-gray-200"
                      : "border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact
                    </th>
                    {!storeFilter && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Store
                      </th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => {
                    const store = storeMap.get(customer.storeId);
                    const defaultAddress =
                      customer.addresses?.find((a) => a.isDefault) ??
                      customer.addresses?.[0];

                    return (
                      <tr key={customer._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(customer.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                                {customer.phone}
                              </p>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {!storeFilter && (
                          <td className="px-5 py-4">
                            {store ? (
                              <Link
                                href={`/admin/stores/${store._id}/customers`}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {store.name}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        )}

                        <td className="px-5 py-4">
                          {defaultAddress ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              {[defaultAddress.city, defaultAddress.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${customer.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? "bg-green-500" : "bg-gray-400"
                                }`}
                            />
                            {customer.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
