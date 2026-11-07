import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const setDocMock = vi.hoisted(() => vi.fn());
const updateDocMock = vi.hoisted(() => vi.fn());
const deleteFieldMock = vi.hoisted(() => vi.fn(() => ({ kind: "deleteField" })));
const getDocMock = vi.hoisted(() => vi.fn());
const docMock = vi.hoisted(() => vi.fn());
const signInWithPopupMock = vi.hoisted(() => vi.fn());

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: signInWithPopupMock,
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
  docMock.mockReturnValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signInGoogle provisioning", () => {
  it("creates a member profile and private email doc when the user is new", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: {
        uid: "u-new",
        displayName: "New User",
        photoURL: "http://example.invalid/photo.jpg",
        email: "new@example.invalid",
      },
    });
    getDocMock.mockResolvedValue({ exists: () => false });

    const user = await signInGoogle();

    expect(user.uid).toBe("u-new");
    expect(docMock).toHaveBeenCalledWith(expect.anything(), "users", "u-new");
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { name: "New User", photoUrl: "http://example.invalid/photo.jpg", role: "member", track: null },
    );
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { email: "new@example.invalid" },
      { merge: true },
    );
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it("stores existing users' email privately and removes a legacy public email", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: { uid: "u-existing", displayName: "Existing", photoURL: "", email: "existing@example.invalid" },
    });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", role: "member", track: null, email: "legacy@example.invalid" }),
    });

    await signInGoogle();

    expect(setDocMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { email: "existing@example.invalid" },
      { merge: true },
    );
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { email: deleteFieldMock() });
  });

  it("keeps existing public profiles intact when no legacy email is present", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: { uid: "u-existing-clean", displayName: "Existing", photoURL: "", email: "clean@example.invalid" },
    });
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: "Existing", role: "member", track: null }),
    });

    await signInGoogle();

    expect(updateDocMock).not.toHaveBeenCalled();
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      { email: "clean@example.invalid" },
      { merge: true },
    );
  });
});
