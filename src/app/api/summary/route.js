import { NextResponse } from 'next/server';
import { findSummary } from '@/lib/repositories/summary.repository';

export async function GET(request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  const search = url.searchParams.get('search') || '';
  const device = url.searchParams.get('device') || 'all';

  try {
    const summary = await findSummary({ date, search, device });
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to load summary records:', error);
    return NextResponse.json(
      { message: 'Error fetching summary records', error: error?.message ?? '' },
      { status: 500 }
    );
  }
}
