import { NextResponse } from 'next/server';
import { products } from '@/lib/products';

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;

export async function POST(req: Request) {
  try {
    const { productId, totalAmount, taxAmount } = await req.json();
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('Creating Coinbase charge:', { 
      product: product.title,
      basePrice: product.price,
      taxAmount,
      totalAmount
    });

    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify({
        name: product.title,
        description: `${product.title} (includes $${taxAmount} tax)`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: totalAmount.toFixed(2),
          currency: 'USD'
        },
        metadata: {
          productId,
          taxAmount: taxAmount.toFixed(2),
          basePrice: product.price.toFixed(2)
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Coinbase Commerce error:', error);
      throw new Error(error.message || 'Failed to create charge');
    }

    const chargeData = await response.json();
    console.log('Charge created successfully:', {
      id: chargeData.data.id,
      amount: chargeData.data.pricing.local.amount,
      metadata: chargeData.data.metadata
    });
    
    return NextResponse.json({ 
      chargeId: chargeData.data.id
    });
  } catch (error) {
    console.error('Error creating charge:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create charge',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 