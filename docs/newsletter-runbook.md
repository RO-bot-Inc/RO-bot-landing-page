# Newsletter runbook: blog subscribers

How a signup on tenthgear.ai becomes an email when a post ships. Built 2026-09-09 after the first real subscriber.

## The pieces

| Piece | Where |
|---|---|
| Subscribe bar | `src/components/NewsletterCTA.astro`, rendered on the homepage, the blog index, and every post page |
| Submissions | Netlify Forms, form `newsletter` (id `6a7dc8974b5c970007df8a8b`). Netlify keeps the record; nothing else reads it except the sync below |
| Subscriber list | Resend segment **Blog subscribers** |
| Send | A Resend **Broadcast** to that segment (Broadcasts carry the one-click unsubscribe marketing mail legally needs) |
| Copy | `docs/distribution/{slug}.md`, section `## Email announcement` |
| Script | `scripts/newsletter.mjs` |
| Secret | `RESEND_API_KEY` in `website/.env` (gitignored). Must be a **Full access** key; a sending-only key fails with "restricted to only send emails". Named `website-newsletter` in the Resend dashboard |
| Netlify auth | The Netlify CLI's saved login, or `NETLIFY_AUTH_TOKEN` in `.env` |

## Commands

```bash
npm run newsletter:sync                                     # form -> segment, additive only
npm run newsletter:announce -- --slug {slug}                # dry run: parse, pre-flight, print
npm run newsletter:announce -- --slug {slug} --test you@x   # one rendered test email
npm run newsletter:announce -- --slug {slug} --send         # sync, confirm, broadcast
```

`--send` runs the sync first, so everyone who signed up before the send is included. It refuses if a broadcast named `blog: {slug}` already exists; check https://resend.com/broadcasts and pass `--force` only if that one never reached "sent".

## Rules the script enforces

- Sync never deletes a contact, never edits an existing contact, never changes `unsubscribed`, and never re-adds someone who opted out.
- Bots POST straight to the form endpoint and skip the browser's `required`, so empty or malformed addresses show up in Netlify. They are counted and skipped.
- Dave's own test signups are listed in `EXCLUDE` in the script and skipped on every sync.
- The email draft must have `**Subject:**`, `**Preview text:**`, and a fenced body ending in `Unsubscribe: [unsubscribe-link]`. That line becomes Resend's real unsubscribe link. Older docs with a `{{unsubscribe}}` footer still parse.
- A slash-less post link is rewritten to `/blog/{slug}/` (the site 301s the bare form). Em dashes and `shared/brand.md` banned words are warnings only.

## Per-post flow

The blog-post skill runs this as its last phase: dry run, test to dave@tenthgear.ai, Dave says send, `--send`.
