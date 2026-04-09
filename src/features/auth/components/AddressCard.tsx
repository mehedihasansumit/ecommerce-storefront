"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2, MapPin, Star } from "lucide-react";
import type { IAddress } from "../types";

interface AddressCardProps {
  address: IAddress;
  onEdit?: (address: IAddress) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (addressId: string) => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  selectable,
  selected,
  onSelect,
}: AddressCardProps) {
  const t = useTranslations("addresses");

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {selectable && (
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected
                  ? "border-[var(--color-primary)]"
                  : "border-gray-300"
              }`}
            >
              {selected && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              )}
            </div>
          )}
          <MapPin size={16} className="text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-800">
            {address.label || t("street")}
          </span>
          {address.isDefault && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Star size={10} />
              {t("default")}
            </span>
          )}
        </div>
        {!selectable && (
          <div className="flex items-center gap-1">
            {!address.isDefault && onSetDefault && (
              <button
                onClick={() => onSetDefault(address._id)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              >
                {t("setDefault")}
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(address)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(address._id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-600 space-y-0.5 ml-6">
        <p>{address.street}</p>
        <p>
          {address.city}
          {address.postalCode ? `, ${address.postalCode}` : ""}
        </p>
        {address.state && <p>{address.state}</p>}
        <p>{address.country}</p>
      </div>
    </>
  );

  if (selectable) {
    return (
      <div
        onClick={() => onSelect?.(address._id)}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          selected
            ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      {cardContent}
    </div>
  );
}
