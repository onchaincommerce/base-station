import { NextResponse } from 'next/server';

// In a real app, you'd store this in a database
const pendingCharges = new Map<string, { productId: string, status: string, downloadUrl?: string }>();

export function updateChargeStatus(chargeId: string, productId: string, status: string, downloadUrl?: string) {
  console.log('Updating charge status:', { chargeId, productId, status, downloadUrl });
  pendingCharges.set(chargeId, { productId, status, downloadUrl });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chargeId = searchParams.get('chargeId');

  if (!chargeId) {
    return NextResponse.json({ error: 'No charge ID provided' }, { status: 400 });
  }

  const chargeData = pendingCharges.get(chargeId);
  
  if (!chargeData) {
    return NextResponse.json({ status: 'unknown' });
  }

  return NextResponse.json({
    status: chargeData.status,
    downloadUrl: chargeData.downloadUrl
  });
} 