# Engineering decisions

## Phase 1

- The canonical navigation in the implementation brief takes precedence over the compact menu shown in the older 390px home mockup. All six public navigation cells, the sign-in/account cell and the join cell remain visible and wrap naturally on narrow screens.
- The descriptor cell, “Google Developer Group on Campus”, appears only on the home route.
- The app keeps Tailwind Preflight as its reset. No additional global margin or padding reset is added.
- Public `users/{uid}` documents contain public profile fields only. Email addresses belong exclusively in `private_users/{uid}`; Firestore rules reject an `email` key on every user create/update.
- Writeup `authorId` and `trackId` are immutable on all updates. Leads can update, publish and unpublish only their own writeups while they currently lead the writeup's track. Only admins can delete writeups.
- Media writes are restricted to the parent writeup's author and admins. A lead role on the same track does not grant access to another author's media.
- Ticker `eventId` and `createdBy` are immutable. Admin and lead updates both enforce the 1–140 character message limit; lead access is scoped to the event's track.
- Track names and colors remain static configuration. Lead names and descriptions are read from Firestore; the static configuration no longer contains sample names or descriptions.
- The existing README already contains one Deploy section, so no duplicate section was present to merge. Its statement that CI does not deploy is now accurate because the automatic deploy job has been removed from the workflow.
- The blog page remains in Phase 2, where all public pages are implemented together. Phase 1 establishes the reusable components and shared shell only.

## Verification constraints

- The repository could not be cloned in this execution environment because DNS resolution for `github.com` failed. Local dependency installation and project test commands therefore cannot be run here. A pull-request CI run is required before treating the phase as verified.
- A local Chromium launch for opening the supplied `file://` mockups did not complete in the available execution window. Browser measurements and pixel comparisons must remain UNVERIFIED until a working browser run produces evidence.
