---
description: "French language pack for the web GUI: registers the fr locale with English fallback and ships French dictionaries for the UI namespaces."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-locale-fr

## Summary

`dsh-client-locale-fr` adds French to the dsh web GUI without touching the shipped `zh`/`en` dictionaries: it registers the `fr` locale (fallback `en`) through the locale plugin's language-pack surface and contributes a French dictionary per UI namespace. Users pick Français in Settings → General → Language; a browser asking for French selects it provisionally when the pack is part of the browser roster. Lookup walks `fr` → `en` per key, so a namespace not yet covered by this pack renders English.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Include the pack's `dsh.client` row in the bundle that boots the GUI. The plugin activates when the `locale` service is available: the language definition and every dictionary register as owned effects. Copy that is captured once at registration time outside the slot render path (for example slash-command descriptions) keeps the language that was active when it registered; re-register after switching to Français to refresh it.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The client entry named-exports `inject = ['locale']` and `apply(ctx)`. `apply` registers `addLanguage({ id: 'fr', label: 'Français', fallback: 'en' })` and one `ctx.locale.register(namespace, 'fr', dict)` effect per contribution in `src/client/dicts/`. Each contribution mirrors the `en` key set of its owning namespace; `src/client/dicts/index.ts` is the single manifest driving registration and the key-parity spec.

</details>

-----

<a id="model-experience"></a>
## Model Experience

None: the pack is a browser-side localization contribution and registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

<a id="known-limitations-and-deferred-work"></a>
## Known Limitations and Deferred Work

- **Coverage follows the manifest** — namespaces absent from `src/client/dicts/index.ts` fall back to English by design; extend the manifest as more copy lands.
- **Registry-held text reads once** — copy captured at registration time outside the slot render path keeps the active language at registration until re-registration (a known property of the locale plugin's language-pack surface).
