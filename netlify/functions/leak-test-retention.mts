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
    if (!intake || intake.purgedAt) continue;
    try {
      if (gcs) for (const f of intake.files) await gcs.remove(f.object);
      intake.files = [];
      intake.links = [];
      intake.materials.notes = '';
      intake.materials.links = 0;
      for (const t of intake.tokens) t.revoked = true;
      intake.purgedAt = new Date().toISOString();
      intake.updatedAt = intake.purgedAt;
      await store.put(intake);
      await markPurged(cfg, row.pageId).catch(() => console.warn('[leak-test] purge log failed'));
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
