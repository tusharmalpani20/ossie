# Ossie Documentation Portability Format V1

Status: Shipped in child `134`
Authority: ADR `0031`

## Purpose

The format moves a Documentation Site snapshot between authorized Ossie
instances. It is not a database backup, live synchronization protocol,
Publication, or source of database identity.

## Package layout

A V1 `.zip` contains only declared regular files:

```text
ossie-docs.json
site.json
README.md
pages/<page-handle>.json
pages/<page-handle>.md
snippets/<snippet-handle>.json
assets/<asset-handle>.<png|jpg|webp>
openapi/source.<json|yaml>
```

`ossie-docs.json` declares format/version/profile/source context, the
`site.json` path, every entry's role, media type, byte size and SHA-256, and a
canonical content fingerprint. Unknown or undeclared entries are rejected.

`site.json` owns portable Site metadata, Home Page, Page/Snippet/Asset indexes,
navigation, aliases, redirect/gone routes, optional OpenAPI source, and
external bindings. Typed Page and Snippet JSON owns the lossless block graph.
Every identity is a package-local lowercase handle; Apply creates fresh
database identities.

## Profiles and authority

- `roundtrip` requires typed Page JSON and includes readable Markdown.
- `markdown-folder` uses indexed Markdown as Page content and cannot represent
  typed relationships that the accepted Markdown grammar excludes.
- In `roundtrip`, typed JSON is authoritative. Markdown is never merged back
  into it.

## Standalone Markdown

Standalone `.md` import creates one new Page. It never replaces an existing
Page. An optional leading H1 proposes the title; the user confirms the final
title and canonical path.

Accepted content is bounded UTF-8 CommonMark: H2–H4 headings, paragraphs, flat
ordered/unordered lists, fenced code, simple block quotes, thematic breaks,
safe block-level links, and supported inline emphasis/code. Raw HTML, MDX,
directives, remote or embedded media, nested/loose structures, unsafe URLs,
and unsupported extensions fail closed.

Standalone Markdown export is readable and deliberately omits description,
keywords, binary media, and lossless typed relationship metadata. Use the Site
ZIP for a complete round trip.

## Inspect and Apply

```http
POST /api/v1/projects/{project}/versions/{version}/documentation-import-inspections?kind=site_package
Idempotency-Key: ...
Content-Type: multipart/form-data
```

The response contains only a bounded safe summary, proposal, issue counts, and
required external bindings. It never returns source bytes, storage paths,
database IDs, credentials, comments, access policy, or Audit evidence.

```http
POST /api/v1/projects/{project}/versions/{version}/documentation-import-inspections/{inspection}/apply
Idempotency-Key: ...
Content-Type: application/json
```

Apply requires the exact fingerprint, explicit target, `confirm: true`, and
one exact authorized Published Artifact selection per external binding. It
rereads and revalidates the stored source. Site packages may create a Site or
target an empty writable Site; they never merge or overwrite populated
content. Markdown targets one Site and creates one Page.

Inspections are creator-bound, expire after one hour, and can be cancelled.
Successful Apply consumes the inspection and records a permanent bounded
Import Application.

## Determinism and compatibility

Canonical JSON recursively sorts object keys, preserves array order, uses
two-space indentation and one final newline. ZIP paths are generated and
lexically ordered, metadata is fixed, and compression is deterministic. The
manifest fingerprints canonical site metadata and all declared entries.

Readers must reject unsupported format versions and profiles. V1 fields are
strict: consumers do not guess precedence, ignore unknown content kinds, or
reuse package handles as database IDs.

## Security limits

Uploads and expanded archives have hard byte, entry, path, depth, node, scalar,
block, Page, Snippet, Asset, OpenAPI, and relationship ceilings defined in the
shared Documentation constants. The archive reader rejects traversal,
absolute/backslash/encoded unsafe paths, duplicate and case-fold collisions,
links/devices, encryption, ZIP64/multi-disk archives, unsupported compression,
and suspicious ratios.

No import performs a remote fetch, follows an OpenAPI external reference,
executes content, invokes a native archive command, reads a server path,
accepts Git credentials, or carries private Ossie URLs.

## Explicit exclusions

V1 does not include comments, mentions, draft search rows, Revision or
Publication history, Publish Links, access settings, Audit/Access evidence,
memberships, credentials, storage coordinates, Git state, signatures,
encryption, patches, or merge/overwrite semantics.
