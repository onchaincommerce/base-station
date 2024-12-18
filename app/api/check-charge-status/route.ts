import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chargeId = searchParams.get('chargeId');

    if (!chargeId) {
      return NextResponse.json({ error: 'Charge ID is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch charge status');
    }

    const data = await response.json();
    
    // Check if payment is confirmed
    const isConfirmed = data.data.timeline.some(
      (event: any) => event.status === 'COMPLETED'
    );

    if (isConfirmed) {
      // In a real app, you would generate or fetch the actual download URL
      const downloadUrl = `/api/download?chargeId=${chargeId}`;
      return NextResponse.json({ downloadUrl });
    }

    return NextResponse.json({ status: 'pending' });

  } catch (error) {
    console.error('Error checking charge status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check charge status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 