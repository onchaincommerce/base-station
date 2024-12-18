import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { articles } from '@/lib/articles';
import { updateChargeStatus } from '../check-charge-status/route';

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', COINBASE_WEBHOOK_SECRET!);
  const computedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

async function generateDownloadUrl(productId: string): Promise<string> {
  // In production, this would:
  // 1. Generate a signed URL (e.g., AWS S3 presigned URL)
  // 2. Set short expiration time
  // 3. Track downloads
  return `https://your-storage.com/downloads/${productId}`;
}

export async function POST(req: Request) {
  try {
    console.log('🎯 Webhook received');
    const headersList = headers();
    const signature = headersList.get('x-cc-webhook-signature');
    
    if (!signature) {
      console.log('❌ No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log('📦 Full webhook payload:', body);
    
    if (body.event.type === 'charge:pending') {
      const charge = body.event.data;
      const productId = charge.metadata.productId;
      
      // Generate download URL
      const downloadUrl = await generateDownloadUrl(productId);

      // Store the charge status with download URL
      updateChargeStatus(charge.id, productId, 'pending', downloadUrl);

      return NextResponse.json({ 
        received: true,
        productId,
        status: 'pending',
        downloadUrl
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 