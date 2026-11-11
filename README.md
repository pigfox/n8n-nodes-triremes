# n8n-nodes-triremes

An [n8n](https://n8n.io) community node for [Triremes](https://triremes.com):
find business websites that fail SEO and AEO checks, by business type and
place, and the problems people report with software and products, inside
your n8n workflows. Built for SEO, AEO and web design agencies looking for
their next clients.

## Install

In n8n: **Settings → Community Nodes → Install**, and enter
`n8n-nodes-triremes`.

## Credential

**Triremes API**: your API key, from
[triremes.com/account/api](https://triremes.com/account/api). API access
is a Triremes subscription; [triremes.com/api](https://triremes.com/api)
has the price and the terms. n8n keeps the key encrypted; the node sends it
only to triremes.com.

## Operations

| Resource | Operation | What you get |
|---|---|---|
| Website | Search Websites | websites on sale, by business type, country, region, city, keyword, a failed check, the SEO score's band, the date measured, and how often sold; up to 50 a call, with `next_cursor` for the next page |
| Website | Get Website | one website on sale, with every check it passed or failed |
| Problem | Search Problems | problems people report, as leads (with businesses) or idea reports; up to 100 a call |

Each website comes with its kind of business, where it is, its SEO score
and AEO score, the checks it fails, when it was measured, its price, how
many times it was sold, and its page on Triremes. It never names the
business or its website: that is the lead, bought on its page.

**SEO score:** the share of Triremes' checks of what search engines can
read on this homepage that it fails, weighted by how serious each check
is. 0% means no gaps; higher is worse.

**AEO score (sometimes called GEO):** the share of Triremes' checks of
whether AI answer engines can reach, read and trust this site that it
fails, weighted by how serious each check is. 0% means no gaps; higher is
worse.

## Example

Every Monday, the dentists in Nevada whose homepage has no meta
description, into a Google Sheet:

1. **Schedule Trigger**: every week.
2. **Triremes**: Website → Search Websites; Filters: Business Type
   `Dentist`, Country `US`, State or Region `NV`, Fails Check
   `No meta description`.
3. **Google Sheets**: Append, one row per website.

## Development

The node is declarative and plain JavaScript: no build and no runtime
dependencies. `npm test` checks it with Node's own test runner.

Releases go to npm from GitHub Actions with npm's trusted publishing and
provenance (`.github/workflows/publish.yml`): publishing a GitHub release
publishes its version, with no npm token stored anywhere.

The node identifies itself to Triremes as `triremes-n8n/1.0`.

MIT licence. Questions: [triremes.com/contact](https://triremes.com/contact).
