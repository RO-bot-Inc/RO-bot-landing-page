// Daily. Sixty days after the Delivered date Dave sets in Notion, the files,
// links, and notes for that intake are deleted and every resume link dies.
// Contact details and the Notion row stay.
import type { Config as FunctionConfig } from '@netlify/functions';
import { config as loadConfig } from '../lib/leak-test/config';
import { Firestore } from '../lib/leak-test/firestore';
import { Storage } from '../lib/leak-test/gcs';
import { deliveredRows, markPurged } from '../lib/leak-test/notion';
import { openStore } from '../lib/leak-test/store';
import { LtError } from '../lib/leak-test/types';

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
    if (!intake || intake.purgedAt) continue;
    try {
      // Close the intake first (conditionally, against the current record), so
      // no upload can land after the objects are deleted; then delete the
      // objects the closed record listed.
      const closed = await store.update(intake.id, (i) => {
        if (i.purgedAt) throw new LtError('invalid', 409);
        for (const t of i.tokens) t.revoked = true;
        i.purgedAt = new Date().toISOString();
        i.updatedAt = i.purgedAt;
      });
      if (gcs) for (const f of closed.files) await gcs.remove(f.object);
      await store.update(intake.id, (i) => {
        i.files = [];
        i.links = [];
        i.materials.notes = '';
        i.materials.links = 0;
      });
      await markPurged(cfg, row.pageId).catch(() => console.warn('[leak-test] purge log failed'));
      purged++;
      console.log(`[leak-test] purged id=${intake.id}`);
    } catch (err) {
      if (err instanceof LtError && err.status === 409) continue;
      console.error(`[leak-test] purge failed id=${intake.id}`, (err as Error).message);
    }
  }
  console.log(`[leak-test] retention run purged=${purged}`);
  return new Response(`purged ${purged}`);
};

export const config: FunctionConfig = { schedule: '@daily' };
