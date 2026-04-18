"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { IAddress } from "../types";
import { AddressCard } from "./AddressCard";
import { AddressForm } from "./AddressForm";

interface AddressSelectorProps {
  addresses: IAddress[];
  onSelect: (address: IAddress | null) => void;
  onSaveNew: (data: Omit<IAddress, "_id">) => Promise<void>;
}

export function AddressSelector({
  addresses,
  onSelect,
  onSaveNew,
}: AddressSelectorProps) {
  const t = useTranslations("addresses");
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultAddr?._id ?? null
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);

  function handleSelect(addressId: string) {
    setSelectedId(addressId);
    setShowNewForm(false);
    const addr = addresses.find((a) => a._id === addressId) || null;
    onSelect(addr);
  }

  function handleEnterNew() {
    setSelectedId(null);
    setShowNewForm(true);
    onSelect(null);
  }

  async function handleSaveNew(data: Omit<IAddress, "_id">) {
    if (saveForFuture) {
      await onSaveNew(data);
    } else {
      // Just pass the address data back without saving
      onSelect({ ...data, _id: "new" } as IAddress);
      setShowNewForm(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-admin-text-secondary">
        {t("savedAddresses")}
      </h3>

      <div className="space-y-2">
        {addresses.map((addr) => (
          <AddressCard
            key={addr._id}
            address={addr}
            selectable
            selected={selectedId === addr._id && !showNewForm}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Enter new address option */}
      {!showNewForm ? (
        <button
          type="button"
          onClick={handleEnterNew}
          className="flex items-center gap-2 w-full p-4 rounded-lg border-2 border-dashed border-admin-border-md text-sm text-admin-text-secondary hover:border-gray-400 hover:text-admin-text-secondary transition-colors"
        >
          <Plus size={16} />
          {t("enterNewAddress")}
        </button>
      ) : (
        <div className="p-4 rounded-lg border-2 border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_3%,transparent)]">
          <AddressForm
            onSubmit={handleSaveNew}
            onCancel={() => {
              setShowNewForm(false);
              // Re-select default
              if (defaultAddr) {
                setSelectedId(defaultAddr._id);
                onSelect(defaultAddr);
              }
            }}
            submitLabel={t("useThisAddress")}
          />
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(e) => setSaveForFuture(e.target.checked)}
              className="w-4 h-4 rounded border-admin-border-md"
              style={{ accentColor: "var(--color-primary)" }}
            />
            <span className="text-sm text-admin-text-secondary">{t("saveForFuture")}</span>
          </label>
        </div>
      )}
    </div>
  );
}
