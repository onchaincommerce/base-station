import { NextResponse } from 'next/server';
import { products } from '@/lib/products';

const TAXJAR_API_KEY = process.env.TAXJAR_API_KEY;
const TAXJAR_API = 'https://api.taxjar.com/v2';

export async function POST(req: Request) {
  try {
    const { productId, zipCode } = await req.json();

    if (!productId || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get location data from zip code
    const locationResponse = await fetch(
      `${TAXJAR_API}/rates/${zipCode}`,
      {
        headers: {
          'Authorization': `Bearer ${TAXJAR_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!locationResponse.ok) {
      throw new Error('Failed to get location data');
    }

    const locationData = await locationResponse.json();
    console.log('📍 Location data:', locationData);

    // Calculate tax with nexus
    const taxResponse = await fetch(
      `${TAXJAR_API}/taxes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TAXJAR_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_country: 'US',
          from_zip: '92093',
          from_state: 'CA',
          to_country: 'US',
          to_zip: zipCode,
          to_state: locationData.rate.state,
          amount: product.price,
          shipping: 0,
          nexus_addresses: [{
            id: 'Main Location',
            country: 'US',
            zip: '92093',
            state: 'CA',
            city: 'La Jolla',
            street: '9500 Gilman Drive'
          }],
          line_items: [{
            id: '1',
            quantity: 1,
            unit_price: product.price,
            product_tax_code: '31000' // Digital goods
          }]
        })
      }
    );

    if (!taxResponse.ok) {
      throw new Error('Failed to calculate tax');
    }

    const taxData = await taxResponse.json();
    console.log('💰 Tax calculation:', taxData);

    // Use the rate from location data since it's more accurate
    const rate = Number(locationData.rate.combined_rate);
    const taxAmount = Number((product.price * rate).toFixed(2));
    const totalAmount = Number((product.price + taxAmount).toFixed(2));

    const result = {
      taxRate: Number((rate * 100).toFixed(2)),
      taxAmount: taxAmount,
      totalAmount: totalAmount
    };

    console.log('✅ Final calculation:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Tax calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 