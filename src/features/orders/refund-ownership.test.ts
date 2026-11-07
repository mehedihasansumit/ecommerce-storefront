import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = { findById: vi.fn(), createRefundRequest: vi.fn() };
vi.mock("./repository", () => ({ OrderRepository: repo }));
vi.mock("@/features/stores/service", () => ({
  StoreService: { getById: async () => ({ _id: "s1", refundPolicy: { enabled: true, windowDays: 30 } }) },
}));

const { OrderService } = await import("./service");

const paidCancelled = {
  _id: "o1",
  storeId: "s1",
  userId: "owner",
  status: "cancelled",
  paymentStatus: "paid",
  total: 1000,
  statusHistory: [{ status: "cancelled", changedAt: new Date() }],
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.findById.mockResolvedValue(paidCancelled);
  repo.createRefundRequest.mockResolvedValue({ ...paidCancelled, refundRequest: { status: "pending" } });
});

describe("requestRefund: only the order's owner", () => {
  it("another customer gets 'Order not found' and no request is made", async () => {
    await expect(OrderService.requestRefund("s1", "o1", { reason: "x" } as never, "someone-else")).rejects.toThrow(
      "Order not found",
    );
    expect(repo.createRefundRequest).not.toHaveBeenCalled();
  });

  it("no customer at all is refused too", async () => {
    await expect(OrderService.requestRefund("s1", "o1", { reason: "x" } as never)).rejects.toThrow("Order not found");
  });

  it("the owner can request it", async () => {
    await OrderService.requestRefund("s1", "o1", { reason: "Damaged" } as never, "owner").catch(() => {});
    expect(repo.createRefundRequest).toHaveBeenCalled();
  });
});
