# Consent & compliance in VoiceVault

Consent is a **product requirement**, not an optional setting.

## What the product does

1. **Consent reminder before every call/meeting recording.** The dialog
   explains that recording laws vary by country and that many jurisdictions
   require all-party consent. It cannot be skipped for `call` and `meeting`
   source types (web: `ConsentDialog.tsx`; mobile: `consent_gate.dart`).
2. **Per-recording acknowledgment.** The "I have obtained consent from
   participants" toggle is stored in the recording's metadata —
   `consent_acknowledged` + `consent_acknowledged_at` — written atomically
   with the recording row and **immutable afterwards** (enforced in
   `recordings.service.ts`, covered by `consent-persistence.spec.ts`). An
   unchecked box is stored honestly as `false`; the app never blocks the user
   on their own legal judgment, it records what they attested.
3. **Verbal announcement.** A short "this call is being recorded" tone plays
   at recording start. Default **ON** for call/meeting modes, toggleable per
   recording and in settings (`announcementDefaultOn`). Whether it played is
   stored as `announcement_played`.
4. **Education, not legal advice.** Settings links to a plain-language
   explanation of one-party vs all-party consent
   (web `/settings/consent`, mobile settings screen) that tells users to
   check their local law.

## Data model

| Column | Meaning |
|---|---|
| `recordings.consent_acknowledged` | The user's attestation at capture time |
| `recordings.consent_acknowledged_at` | When it was made (NULL if not attested) |
| `recordings.announcement_played` | Whether the audible notice ran |

These are audit facts: the API's metadata-update path cannot modify them, and
the offline sync path only writes them at row creation.
