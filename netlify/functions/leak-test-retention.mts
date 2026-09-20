// Daily. Sixty days after the Delivered date Dave sets in Notion, the files,
// links, and notes for that intake are deleted and every resume link dies.
// Contact details and the Notion row stay.
import type { Config as FunctionConfig } from '@netlify/functions';
import { config as loadConfig } from '../lib/leak-test/config';
import { Firestore } from '../lib/leak-test/firestore';
import { Storage } from '../lib/leak-test/gcs';
import { deliveredRows, markPurged } from '../lib/leak-test/notion';
import { openStore } from '../lib/leak-test/store';

export default async () => {
  const cfg = loadConfig();
  if (cfg.notion !== 'live') return new Response('notion off');
  const store = openStore(cfg);
  const gcs = cfg.uploads === 'gcs' ? new Storage(new Firestore(cfg.serviceAccount).sa, cfg.storageBucket) : null;
  const cutoff = Date.now() - cfg.retentionDays * 86_400_000;
  let purged = 0;

  for (const row of await deliveredRows(cfg)) {
    if (Date.parse(row.delivered) > cutoff) continue;
    const intake = await store.get(row.intakeId);
    // "Purged" means finished, not started: a run that failed halfway is retried
    // until nothing is left on the record.
    if (!intake) continue;
    const empty = intake.purgedAt && !intake.files.length && !intake.links.length && !intake.materials.notes;
    if (empty && intake.purgeLoggedAt) continue;
    try {
      // Close the intake first (idempotent, against the current record) so no
      // participant write lands after the objects go; then delete objects one
      // by one, keeping every failure for the next run.
      const closed = await store.update(intake.id, (i) => {
        for (const t of i.tokens) t.revoked = true;
        if (!i.purgedAt) i.purgedAt = new Date().toISOString();
        i.updatedAt = new Date().toISOString();
      });
      const removed = new Set<string>();
      for (const f of closed.files) {
        try {
          if (gcs) await gcs.remove(f.object);
          removed.add(f.id);
        } catch (err) {
          console.error(`[leak-test] purge: object delete failed id=${intake.id} file=${f.id}`, (err as Error).message);
        }
      }
      const cleared = await store.update(intake.id, (i) => {
        i.files = i.files.filter((f) => !removed.has(f.id));
        i.links = [];
        i.materials.notes = '';
        i.materials.links = 0;
        i.materials.files = 0;
      });
      if (cleared.files.length) {
        console.error(`[leak-test] purge incomplete id=${intake.id} remaining=${cleared.files.length}; retried next run`);
        continue;
      }
      // The Notion page still holds their notes until this lands; a failure
      // here keeps the row eligible so the next run tries again.
      try {
        await markPurged(cfg, row.pageId);
      } catch (err) {
        console.error(`[leak-test] purge: Notion not updated id=${intake.id}; retried next run`, (err as Error).message);
        continue;
      }
      await store.update(intake.id, (i) => {
        i.purgeLoggedAt = new Date().toISOString();
      });
      purged++;
      console.log(`[leak-test] purged id=${intake.id}`);
    } catch (err) {
      console.error(`[leak-test] purge failed id=${intake.id}`, (err as Error).message);
    }
  }
  console.log(`[leak-test] retention run purged=${purged}`);
  return new Response(`purged ${purged}`);
};

export const config: FunctionConfig = { schedule: '@daily' };
