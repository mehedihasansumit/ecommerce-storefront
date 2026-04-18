"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2, MapPin, Star } from "lucide-react";
import type { IAddress } from "../types";
import { Button, Badge } from "@/shared/components/ui";

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
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {selectable && (
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected ? "border-[var(--color-primary)]" : "border-admin-border-md"
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
          <MapPin size={15} className="text-admin-text-subtle shrink-0" />
          <span className="text-sm font-semibold text-admin-text-secondary truncate">
            {address.label || t("street")}
          </span>
          {address.isDefault && (
            <Badge tone="brand" size="sm">
              <Star size={9} />
              {t("default")}
            </Badge>
          )}
        </div>

        {!selectable && (
          <div className="flex items-center gap-1 shrink-0">
            {!address.isDefault && onSetDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetDefault(address._id)}
              >
                {t("setDefault")}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(address)}
                aria-label="Edit address"
              >
                <Pencil size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(address._id)}
                aria-label="Delete address"
                className="text-admin-text-subtle hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 text-sm text-admin-text-muted space-y-0.5 ml-6">
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
            : "border-admin-border hover:border-admin-border-md"
        }`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-admin-border bg-admin-surface hover:border-admin-border-md transition-colors">
      {cardContent}
    </div>
  );
}
