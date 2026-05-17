"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2, Plus } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea, Alert } from "@/shared/components/ui";
import { tAdmin } from "@/shared/lib/i18n";
import type {
  CampaignAudience,
  CampaignStatus,
  CampaignType,
  ICondition,
  IReward,
} from "@/features/campaigns/types";
import type { LocalizedString } from "@/shared/types/i18n";

interface CategoryOption {
  _id: string;
  name: LocalizedString;
}

interface Props {
  storeId: string;
  categories?: CategoryOption[];
  initial?: {
    _id?: string;
    slug: string;
    name: { en: string; bn?: string };
    description?: { en?: string; bn?: string } | null;
    type: CampaignType;
    status: CampaignStatus;
    priority: number;
    stackable: boolean;
    repeatable: boolean;
    audience: CampaignAudience;
    minCartTotal: number | null;
    startDate: string;
    endDate: string;
    usageLimit: number | null;
    perUserLimit: number | null;
    conditions: ICondition[];
    rewards: IReward[];
    isActive: boolean;
  };
}

const defaultCondition = (): ICondition => ({
  type: "categoryQty",
  categoryId: "",
  minQty: 1,
});

const defaultReward = (): IReward => ({
  type: "freeFromCategory",
  categoryId: "",
  qty: 1,
});

export function CampaignForm({ storeId, categories = [], initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?._id;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [nameEn, setNameEn] = useState(initial?.name.en ?? "");
  const [nameBn, setNameBn] = useState(initial?.name.bn ?? "");
  const [descEn, setDescEn] = useState(initial?.description?.en ?? "");
  const [type, setType] = useState<CampaignType>(initial?.type ?? "bundle");
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? "draft");
  const [audience, setAudience] = useState<CampaignAudience>(initial?.audience ?? "all");
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [stackable, setStackable] = useState(initial?.stackable ?? false);
  const [repeatable, setRepeatable] = useState(initial?.repeatable ?? false);
  const [minCartTotal, setMinCartTotal] = useState<string>(
    initial?.minCartTotal !== null && initial?.minCartTotal !== undefined
      ? String(initial.minCartTotal)
      : "",
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? new Date().toISOString().slice(0, 16),
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  );
  const [usageLimit, setUsageLimit] = useState<string>(
    initial?.usageLimit !== null && initial?.usageLimit !== undefined
      ? String(initial.usageLimit)
      : "",
  );
  const [perUserLimit, setPerUserLimit] = useState<string>(
    initial?.perUserLimit !== null && initial?.perUserLimit !== undefined
      ? String(initial.perUserLimit)
      : "",
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [conditions, setConditions] = useState<ICondition[]>(
    initial?.conditions ?? [defaultCondition()],
  );
  const [rewards, setRewards] = useState<IReward[]>(initial?.rewards ?? [defaultReward()]);

  function updateCondition(i: number, patch: Partial<ICondition>) {
    setConditions((cs) => cs.map((c, idx) => (idx === i ? ({ ...c, ...patch } as ICondition) : c)));
  }

  function changeConditionType(i: number, newType: ICondition["type"]) {
    const fresh: ICondition =
      newType === "categoryQty"
        ? { type: "categoryQty", categoryId: "", minQty: 1 }
        : newType === "productQty"
          ? { type: "productQty", productId: "", minQty: 1 }
          : newType === "specificProducts"
            ? { type: "specificProducts", productIds: [], minQty: 1 }
            : { type: "cartTotal", minAmount: 0 };
    setConditions((cs) => cs.map((c, idx) => (idx === i ? fresh : c)));
  }

  function changeRewardType(i: number, newType: IReward["type"]) {
    const fresh: IReward =
      newType === "freeProduct"
        ? { type: "freeProduct", productId: "", qty: 1 }
        : newType === "freeFromCategory"
          ? { type: "freeFromCategory", categoryId: "", qty: 1 }
          : newType === "percentDiscount"
            ? { type: "percentDiscount", percent: 10, appliesTo: "cart" }
            : newType === "fixedDiscount"
              ? { type: "fixedDiscount", amount: 0 }
              : { type: "freeShipping" };
    setRewards((rs) => rs.map((r, idx) => (idx === i ? fresh : r)));
  }

  function updateReward(i: number, patch: Partial<IReward>) {
    setRewards((rs) => rs.map((r, idx) => (idx === i ? ({ ...r, ...patch } as IReward) : r)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        storeId,
        slug,
        name: { en: nameEn, ...(nameBn ? { bn: nameBn } : {}) },
        description: descEn ? { en: descEn } : null,
        type,
        status,
        audience,
        priority,
        stackable,
        repeatable,
        minCartTotal: minCartTotal ? Number(minCartTotal) : null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: perUserLimit ? Number(perUserLimit) : null,
        conditions,
        rewards,
        isActive,
      };

      const url = isEdit ? `/api/campaigns/${initial!._id}` : "/api/campaigns";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(isEdit ? "Campaign updated" : "Campaign created");
      router.push(`/admin/stores/${storeId}/campaigns`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {error && <Alert tone="error">{error}</Alert>}

      <Card padding="lg">
        <h2 className="text-base font-semibold mb-4">Basics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Slug" required>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="summer-bogo" />
          </Field>
          <Field label="Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as CampaignType)}>
              <option value="bogo">BOGO</option>
              <option value="bundle">Bundle</option>
              <option value="tiered">Tiered Discount</option>
              <option value="freeGift">Free Gift</option>
            </Select>
          </Field>
          <Field label="Name (EN)" required>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </Field>
          <Field label="Name (BN)">
            <Input value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
          </Field>
          <Field label="Description (EN)" className="md:col-span-2">
            <Textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} />
          </Field>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-base font-semibold mb-4">Schedule & limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </Select>
          </Field>
          <Field label="Audience">
            <Select value={audience} onChange={(e) => setAudience(e.target.value as CampaignAudience)}>
              <option value="all">All</option>
              <option value="loggedInOnly">Logged in only</option>
              <option value="firstOrder">First order only</option>
            </Select>
          </Field>
          <Field label="Start" required>
            <Input
              type="datetime-local"
              value={startDate.slice(0, 16)}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="End" required>
            <Input
              type="datetime-local"
              value={endDate.slice(0, 16)}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
          <Field label="Min cart total (optional)">
            <Input
              type="number"
              value={minCartTotal}
              onChange={(e) => setMinCartTotal(e.target.value)}
            />
          </Field>
          <Field label="Priority">
            <Input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
          </Field>
          <Field label="Total usage limit (blank = unlimited)">
            <Input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
          </Field>
          <Field label="Per-user limit (blank = unlimited)">
            <Input value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stackable} onChange={(e) => setStackable(e.target.checked)} />
            Stackable with other campaigns
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={repeatable}
              onChange={(e) => setRepeatable(e.target.checked)}
            />
            Repeatable per cart
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Enabled
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Conditions (ALL must match)</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setConditions((cs) => [...cs, defaultCondition()])}
          >
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {conditions.map((c, i) => (
            <div key={i} className="border rounded-lg p-3 flex flex-wrap items-end gap-3">
              <Field label="Type">
                <Select
                  value={c.type}
                  onChange={(e) => changeConditionType(i, e.target.value as ICondition["type"])}
                >
                  <option value="categoryQty">Category qty</option>
                  <option value="productQty">Product qty</option>
                  <option value="specificProducts">Specific products</option>
                  <option value="cartTotal">Cart total</option>
                </Select>
              </Field>
              {c.type === "categoryQty" && (
                <>
                  <Field label="Category" required>
                    <Select
                      value={c.categoryId}
                      onChange={(e) => updateCondition(i, { categoryId: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {tAdmin(cat.name)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Min qty">
                    <Input
                      type="number"
                      value={c.minQty}
                      onChange={(e) => updateCondition(i, { minQty: Number(e.target.value) })}
                    />
                  </Field>
                </>
              )}
              {c.type === "productQty" && (
                <>
                  <Field label="Product ID">
                    <Input
                      value={c.productId}
                      onChange={(e) => updateCondition(i, { productId: e.target.value })}
                    />
                  </Field>
                  <Field label="Min qty">
                    <Input
                      type="number"
                      value={c.minQty}
                      onChange={(e) => updateCondition(i, { minQty: Number(e.target.value) })}
                    />
                  </Field>
                </>
              )}
              {c.type === "specificProducts" && (
                <>
                  <Field label="Product IDs (comma-separated)">
                    <Input
                      value={c.productIds.join(",")}
                      onChange={(e) =>
                        updateCondition(i, {
                          productIds: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                  <Field label="Min qty">
                    <Input
                      type="number"
                      value={c.minQty}
                      onChange={(e) => updateCondition(i, { minQty: Number(e.target.value) })}
                    />
                  </Field>
                </>
              )}
              {c.type === "cartTotal" && (
                <Field label="Min amount">
                  <Input
                    type="number"
                    value={c.minAmount}
                    onChange={(e) => updateCondition(i, { minAmount: Number(e.target.value) })}
                  />
                </Field>
              )}
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                onClick={() => setConditions((cs) => cs.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Rewards</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setRewards((rs) => [...rs, defaultReward()])}
          >
            Add
          </Button>
        </div>
        <div className="space-y-3">
          {rewards.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 flex flex-wrap items-end gap-3">
              <Field label="Type">
                <Select
                  value={r.type}
                  onChange={(e) => changeRewardType(i, e.target.value as IReward["type"])}
                >
                  <option value="freeProduct">Free product</option>
                  <option value="freeFromCategory">Free from category</option>
                  <option value="percentDiscount">Percent discount</option>
                  <option value="fixedDiscount">Fixed discount</option>
                  <option value="freeShipping">Free shipping</option>
                </Select>
              </Field>
              {r.type === "freeProduct" && (
                <>
                  <Field label="Product ID">
                    <Input
                      value={r.productId}
                      onChange={(e) => updateReward(i, { productId: e.target.value })}
                    />
                  </Field>
                  <Field label="Qty">
                    <Input
                      type="number"
                      value={r.qty}
                      onChange={(e) => updateReward(i, { qty: Number(e.target.value) })}
                    />
                  </Field>
                </>
              )}
              {r.type === "freeFromCategory" && (
                <>
                  <Field label="Category" required>
                    <Select
                      value={r.categoryId}
                      onChange={(e) => updateReward(i, { categoryId: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {tAdmin(cat.name)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Qty">
                    <Input
                      type="number"
                      value={r.qty}
                      onChange={(e) => updateReward(i, { qty: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Max value (optional)">
                    <Input
                      type="number"
                      value={r.maxValue ?? ""}
                      onChange={(e) =>
                        updateReward(i, {
                          maxValue: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </Field>
                </>
              )}
              {r.type === "percentDiscount" && (
                <>
                  <Field label="Percent">
                    <Input
                      type="number"
                      value={r.percent}
                      onChange={(e) => updateReward(i, { percent: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Applies to">
                    <Select
                      value={r.appliesTo}
                      onChange={(e) =>
                        updateReward(i, { appliesTo: e.target.value as "cart" | "category" | "product" })
                      }
                    >
                      <option value="cart">Cart</option>
                      <option value="category">Category</option>
                      <option value="product">Product</option>
                    </Select>
                  </Field>
                  {r.appliesTo === "category" && (
                    <Field label="Category" required>
                      <Select
                        value={r.targetId ?? ""}
                        onChange={(e) => updateReward(i, { targetId: e.target.value })}
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {tAdmin(cat.name)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                  {r.appliesTo === "product" && (
                    <Field label="Product ID">
                      <Input
                        value={r.targetId ?? ""}
                        onChange={(e) => updateReward(i, { targetId: e.target.value })}
                      />
                    </Field>
                  )}
                </>
              )}
              {r.type === "fixedDiscount" && (
                <Field label="Amount">
                  <Input
                    type="number"
                    value={r.amount}
                    onChange={(e) => updateReward(i, { amount: Number(e.target.value) })}
                  />
                </Field>
              )}
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                onClick={() => setRewards((rs) => rs.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? "Save changes" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}
