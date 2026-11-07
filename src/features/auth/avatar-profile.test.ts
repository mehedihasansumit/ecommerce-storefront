import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = { findUserById: vi.fn(), updateUser: vi.fn() };
const deleteFile = vi.fn();

vi.mock("./repository", () => ({ AuthRepository: repo }));
vi.mock("@/shared/lib/storage", () => ({
  deleteFile: (key: string) => deleteFile(key),
  publicUrlFor: (key: string) => `/api/media/${key}`,
  keyFromUrl: (url: string) => {
    const i = url.indexOf("/api/media/");
    return i >= 0 ? url.slice(i + "/api/media/".length) : null;
  },
}));

const { AuthService, isInFolder } = await import("./service");

const STORE = "store-a";
const USER = "user-1";
const own = (name: string) => `/api/media/${STORE}/avatars/${USER}/${name}`;
const position = { x: 50, y: 50, zoom: 1 };

function userWithAvatar(avatarUrl: string | null) {
  repo.findUserById.mockResolvedValue({ _id: USER, storeId: STORE, avatarUrl, passwordHash: "h" });
}

beforeEach(() => {
  vi.clearAllMocks();
  repo.updateUser.mockImplementation(async (_id: string, data: object) => ({
    _id: USER,
    storeId: STORE,
    passwordHash: "h",
    ...data,
  }));
});

describe("updateCustomerProfile: avatars are limited to the customer's own folder", () => {
  it("rejects pointing the avatar at a product image (the file-deletion attack)", async () => {
    userWithAvatar(null);
    await expect(
      AuthService.updateCustomerProfile(USER, {
        avatarUrl: `/api/media/${STORE}/products/abc.webp`,
        avatarPosition: position,
      }),
    ).rejects.toThrow("Invalid avatar");
    expect(repo.updateUser).not.toHaveBeenCalled();
  });

  it("rejects another customer's avatar, another store's folder, and path tricks", async () => {
    userWithAvatar(null);
    for (const avatarUrl of [
      `/api/media/${STORE}/avatars/user-2/x.webp`,
      `/api/media/store-b/avatars/${USER}/x.webp`,
      `/api/media/${STORE}/avatars/${USER}/../../products/abc.webp`,
      `https://tracker.example/pixel.gif`,
    ]) {
      await expect(
        AuthService.updateCustomerProfile(USER, { avatarUrl, avatarPosition: position }),
      ).rejects.toThrow("Invalid avatar");
    }
    expect(repo.updateUser).not.toHaveBeenCalled();
  });

  it("never deletes an old avatar that isn't in the customer's own folder", async () => {
    // e.g. an earlier attacker-set value, or an avatar from before per-customer folders
    userWithAvatar(`/api/media/${STORE}/products/abc.webp`);
    await AuthService.updateCustomerProfile(USER, { avatarUrl: own("new.webp"), avatarPosition: position });
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it("accepts the customer's own upload and deletes their previous one", async () => {
    userWithAvatar(own("old.webp"));
    const user = await AuthService.updateCustomerProfile(USER, {
      avatarUrl: own("new.webp"),
      avatarPosition: position,
    });
    expect(user.avatarUrl).toBe(own("new.webp"));
    expect(deleteFile).toHaveBeenCalledWith(`${STORE}/avatars/${USER}/old.webp`);
  });

  it("stores the canonical URL, not the host the client sent", async () => {
    userWithAvatar(null);
    const user = await AuthService.updateCustomerProfile(USER, {
      avatarUrl: `https://evil.example${own("new.webp")}`,
      avatarPosition: position,
    });
    expect(user.avatarUrl).toBe(own("new.webp"));
  });
});

describe("isInFolder", () => {
  it("only accepts a file directly inside the folder", () => {
    expect(isInFolder("s/avatars/u/a.webp", "s/avatars/u/")).toBe(true);
    expect(isInFolder("s/avatars/u/", "s/avatars/u/")).toBe(false);
    expect(isInFolder("s/avatars/u/sub/a.webp", "s/avatars/u/")).toBe(false);
    expect(isInFolder("s/avatars/u2/a.webp", "s/avatars/u/")).toBe(false);
    expect(isInFolder(null, "s/avatars/u/")).toBe(false);
  });
});
