import { ingest } from '@/lib/ingestion';

export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await ingest();
  return Response.json(result);
}
