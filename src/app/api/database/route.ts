import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

interface DatabaseQueryRequest {
  query: string;
  type?: 'user' | 'delivery' | 'product' | 'general';
}

interface DatabaseQueryResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DatabaseQueryRequest = await req.json();
    const { query, type = 'general' } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const lowerQuery = query.toLowerCase();
    let data: any = null;

    // Try to understand the query type and fetch relevant data
    if (type === 'user' || lowerQuery.includes('user') || lowerQuery.includes('customer')) {
      // Query user information
      if (lowerQuery.includes('email')) {
        const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          const { data: userData, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('email', emailMatch[0])
            .single();

          if (!error && userData) {
            data = userData;
          }
        }
      } else if (lowerQuery.includes('all') || lowerQuery.includes('list')) {
        const { data: userData, error } = await supabaseServer
          .from('users')
          .select('*')
          .limit(10);

        if (!error) {
          data = userData;
        }
      }
    } else if (type === 'delivery' || lowerQuery.includes('delivery') || lowerQuery.includes('order')) {
      // Query delivery information
      if (lowerQuery.includes('status')) {
        const statusMatch = query.match(/status\s+(is|:|=)?\s*(\w+)/i);
        if (statusMatch) {
          const status = statusMatch[2].toUpperCase();
          const { data: deliveryData, error } = await supabaseServer
            .from('deliveries')
            .select('*')
            .eq('status', status)
            .limit(10);

          if (!error) {
            data = deliveryData;
          }
        }
      } else if (lowerQuery.includes('order number') || lowerQuery.includes('order #')) {
        const orderNumberMatch = query.match(/order\s*(number|#)?\s*:?\s*(\w+)/i);
        if (orderNumberMatch) {
          const { data: deliveryData, error } = await supabaseServer
            .from('deliveries')
            .select('*')
            .eq('order_number', orderNumberMatch[2])
            .single();

          if (!error && deliveryData) {
            data = deliveryData;
          }
        }
      } else {
        // Get recent deliveries
        const { data: deliveryData, error } = await supabaseServer
          .from('deliveries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error) {
          data = deliveryData;
        }
      }
    } else if (type === 'product' || lowerQuery.includes('product')) {
      // Query product information
      if (lowerQuery.includes('category')) {
        const categoryMatch = query.match(/category\s+(is|:|=)?\s*(\w+)/i);
        if (categoryMatch) {
          const category = categoryMatch[2];
          const { data: productData, error } = await supabaseServer
            .from('products')
            .select('*')
            .ilike('category', `%${category}%`)
            .limit(10);

          if (!error) {
            data = productData;
          }
        }
      } else if (lowerQuery.includes('in stock')) {
        const { data: productData, error } = await supabaseServer
          .from('products')
          .select('*')
          .eq('in_stock', true)
          .limit(10);

        if (!error) {
          data = productData;
        }
      } else {
        // Get all products
        const { data: productData, error } = await supabaseServer
          .from('products')
          .select('*')
          .limit(10);

        if (!error) {
          data = productData;
        }
      }
    } else {
      // General query - try to fetch a bit of everything
      const [usersResult, deliveriesResult, productsResult] = await Promise.allSettled([
        supabaseServer.from('users').select('*').limit(3),
        supabaseServer.from('deliveries').select('*').limit(3),
        supabaseServer.from('products').select('*').limit(3),
      ]);

      data = {
        users: usersResult.status === 'fulfilled' ? usersResult.value.data : [],
        deliveries: deliveriesResult.status === 'fulfilled' ? deliveriesResult.value.data : [],
        products: productsResult.status === 'fulfilled' ? productsResult.value.data : [],
      };
    }

    const response: DatabaseQueryResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in database query API:', error);
    return NextResponse.json(
      {
        error: 'Failed to query database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AderaBot-Hermes Database API is running',
    endpoints: {
      POST: '/api/database',
    },
    tables: ['users', 'deliveries', 'products'],
    version: '1.0.0',
  });
}
