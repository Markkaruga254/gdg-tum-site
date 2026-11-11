import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const setDocMock = vi.hoisted(() => vi.fn());
const updateDocMock = vi.hoisted(() => vi.fn());
const deleteFieldMock = vi.hoisted(() => vi.fn(() => ({ kind: "deleteField" })));
const getDocMock = vi.hoisted(() => vi.fn());
const docMock = vi.hoisted(() => vi.fn());
const signInWithPopupMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: signInWithPopupMock,
  signOut: signOutMock,
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getAuth: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  doc: docMock,
  getDoc: getDocMock,
  setDoc: setDocMock,
  updateDoc: updateDocMock,
  deleteField: deleteFieldMock,
  getFirestore: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({
  app: {},
  db: {},
}));

import { signInGoogle } from "../auth";

beforeEach(() => {
  vi.resetAllMocks();
  deleteFieldMock.mockReturnValue({ kind: "deleteField" });
  docMock.mockReturnValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const googleUser = {
  uid: "u-existing",
  displayName: "Existing",
  photoURL: "https://example.invalid/photo.jpg",
  email: "existing@example.invalid",
};

describe("signInGoogle staff authorization", () => {
  it("rejects a Google account without a provisioned profile and signs it out", async () => {
    signInWithPopupMock.mockResolvedValue({ user: { ...googleUser, uid: "u-new" } });
    getDocMock.mockResolvedValue({ exists: () => false });

    await expect(signInGoogle()).rejects.toThrow(/not provisioned as a GDG TUM Track Lead or Admin/);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it("rejects an existing member profile without changing it", async () => {
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", role: "member", track: null }),
    });

    await expect(signInGoogle()).rejects.toThrow(/not provisioned as a GDG TUM Track Lead or Admin/);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it("rejects a lead profile without an assigned track", async () => {
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", role: "lead", track: null }),
    });

    await expect(signInGoogle()).rejects.toThrow(/not provisioned as a GDG TUM Track Lead or Admin/);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it.each([
    ["lead", { role: "lead", track: "cloud" }],
    ["admin", { role: "admin", track: null }],
  ])("allows a provisioned %s and stores their email privately", async (_role, profile) => {
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", ...profile }),
    });

    const user = await signInGoogle();

    expect(user.uid).toBe("u-existing");
    expect(signOutMock).not.toHaveBeenCalled();
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { email: "existing@example.invalid" },
      { merge: true },
    );
  });

  it("migrates a legacy public email only after staff authorization", async () => {
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", role: "lead", track: "cloud", email: "legacy@example.invalid" }),
    });

    await signInGoogle();

    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { email: deleteFieldMock() });
  });

  it("signs out if the staff profile cannot be read", async () => {
    signInWithPopupMock.mockResolvedValue({ user: googleUser });
    getDocMock.mockRejectedValue(new Error("permission denied"));

    await expect(signInGoogle()).rejects.toThrow("permission denied");

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).not.toHaveBeenCalled();
  });
});
