# Plan 147 — organization-admin blind review A

Candidate: `c4141a1` (`fix(web): compose organization administration`)

Review lens: administration hierarchy, invite-form density, member and
pending-invite row framing, compliance timeline measure, retained-evidence
cards, narrow composition, and the shared-shell boundary.

## Verdict

`accept`

## Findings

- The members route now reads as one administration workspace with a clear
  organization header, a focused invite panel, and separate Members and
  Pending invites surfaces. Member identity, email, role, invite expiry, and
  revoke action have a calmer hierarchy.
- The invite form uses the available desktop width deliberately and stacks
  without overflow at 390px. The compliance link remains visible as the
  adjacent administrative destination rather than competing with the form.
- The compliance route now has a bounded page measure, a clear evidence-kind
  control, stronger totals cards, and framed evidence entries. Long action and
  metadata labels wrap inside the card instead of creating a second reading
  width.
- The 390px routes preserve the content width while the existing portal
  navigation remains horizontally scrollable shared-shell behavior outside
  this candidate.

## Evidence reviewed

- `docs/ui/147-organization-admin-before-members-desktop.png`
- `docs/ui/147-organization-admin-before-members-narrow.png`
- `docs/ui/147-organization-admin-before-compliance-narrow.png`
- `docs/ui/147-organization-admin-after-members-desktop.png`
- `docs/ui/147-organization-admin-after-members-narrow.png`
- `docs/ui/147-organization-admin-after-compliance-desktop.png`
- `docs/ui/147-organization-admin-after-compliance-narrow.png`
- Authenticated owner members/compliance routes at 1440px and 390px.

No blocking visual or interaction finding remains for this bounded surface.
