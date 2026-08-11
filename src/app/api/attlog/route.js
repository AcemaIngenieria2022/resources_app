import { NextResponse } from 'next/server';
import { findAttlog, findAttlogSummary } from '@/lib/repositories/attlog.repository';

export async function GET(request) {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || 'all';
  const date = url.searchParams.get('date') || '';
  const fromDate = url.searchParams.get('fromDate') || '';
  const toDate = url.searchParams.get('toDate') || '';
  const search = url.searchParams.get('search') || '';
  const device = url.searchParams.get('device') || '';
  const employeedIDs = url.searchParams.getAll('employeedID');
  const sortBy = url.searchParams.get('sortBy') || 'authDateTime';
  const sortDir = url.searchParams.get('sortDir') || 'desc';
  const summary = url.searchParams.get('summary') === '1' || url.searchParams.get('summary') === 'true';

  try {
    const records = summary
      ? await findAttlogSummary({ fromDate, toDate, search, employeedIDs })
      : await findAttlog({ limit, date, fromDate, toDate, search, device, employeedID: employeedIDs.length > 0 ? employeedIDs[0] : '', sortBy, sortDir });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to fetch attlog records:', error);
    return NextResponse.json(
      { message: 'Error fetching attlog records', error: error?.message ?? '' },
      { status: 500 }
    );
  }
}
