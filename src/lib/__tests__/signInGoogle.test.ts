import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const setDocMock = vi.hoisted(() => vi.fn());
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
    );
  });

  it("skips provisioning when the user profile already exists", async () => {
    signInWithPopupMock.mockResolvedValue({
      user: { uid: "u-existing", displayName: "Existing", photoURL: "", email: "existing@example.invalid" },
    });
    getDocMock.mockResolvedValue({ exists: () => true });

    await signInGoogle();

    expect(setDocMock).not.toHaveBeenCalled();
  });
});
