# Ossie Brand Assets

Status: Selected working identity and integrated raster asset set.

The current Ossie identity uses the selected GPT-generated Calm & Premium
purple octopus direction. These files replace the provisional repository-made
SVG studies, which have been removed.

## Source Assets

The following renamed files are byte-for-byte copies of the selected exports
from `/home/tm/Downloads/ossie/chatgpt/`:

- `ossie-mascot-primary.png`: standalone mascot artwork on an off-white field.
- `ossie-horizontal-lockup.png`: mascot and lowercase `ossie` wordmark.
- `ossie-app-icon.png`: deep-purple square application icon.
- `ossie-brand-sheet.png`: source review sheet with mark, lockup, app icon,
  size examples, and palette.

The original timestamp-based download names are deliberately not used inside
the repository. Stable descriptive names prevent UI and documentation links
from depending on export timestamps.

## Runtime Derivatives

Runtime copies are resized from `ossie-app-icon.png` and live beside the
applications that serve them:

- Portal: `apps/web/public/brand/` and `apps/web/public/favicon.ico`.
- Docs App: `apps/docs/public/brand/` and `apps/docs/app/favicon.ico`.
- Extension: `apps/extension/public/icons/`.

The full-resolution source exports remain in this directory. Applications must
use the smaller derivatives instead of loading the one-megabyte source image in
compact headers or browser metadata.

## Current Usage

- The repository README presents the horizontal lockup.
- Portal headers, authentication, setup, and invitation surfaces use the app
  icon with the Ossie display name.
- The Docs App presents the mascot in its first viewport and declares the app
  icon in metadata.
- The extension popup, toolbar action, and extension package use the generated
  16, 32, 48, and 128 px icon set.

## UI Color Authority

`DESIGN.md` is the source of truth for interface color tokens. The selected
identity establishes the deep aubergine and vivid violet family, but agents and
applications must not sample arbitrary colors from the raster artwork or brand
sheet.

Purple is Ossie's signature, not its wallpaper. Use the accepted semantic
purple tokens for brand regions, primary action, focus, and selection. Keep
operational surfaces neutral and preserve green, amber, and red for their
semantic states.

## Constraints And Follow-Up

These are raster-generated identity assets, not editable vector masters. The
small icon remains understandable, but its 3D lighting and fine tentacle detail
soften at favicon sizes. Do not describe these files as a final vector system.

Before commercial launch, the identity still needs professional trademark and
logo clearance, a consistent source-of-truth geometry pass, and human review of
small-size rendering. Future optimisation may create AVIF or WebP derivatives,
but the selected PNG sources must remain unchanged unless a new brand decision
explicitly replaces them.
