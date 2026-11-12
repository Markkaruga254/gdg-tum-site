export interface WriteupPermissionTarget {
  authorId?: string;
  trackId?: string;
}

export function canManageWriteup(
  role: string,
  uid: string | null | undefined,
  currentTrack: string | null | undefined,
  writeup: WriteupPermissionTarget,
): boolean {
  return role === "admin" || (
    role === "lead"
    && Boolean(uid)
    && Boolean(currentTrack)
    && writeup.trackId === currentTrack
  );
}
