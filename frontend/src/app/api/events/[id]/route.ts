import { NextRequest } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const event = store.getById(id);

  if (!event) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }

  return Response.json(event);
}
