import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { supabaseServer } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'adera-hermes-secret-key-2025';

// Valid roles for Supabase users
const VALID_USER_ROLES = ['customer', 'driver', 'partner', 'admin'];
type ValidUserRole = typeof VALID_USER_ROLES[number];

// Middleware to verify JWT and extract user
async function getUserFromToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, query } = await request.json();

    // Verify token and get user
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin: return users, deliveries, products for "My Data" / admin panel
    if (user.role === 'admin') {
      const [usersRes, deliveriesRes, productsRes] = await Promise.all([
        supabaseServer.from('users').select('id, email, role, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(50),
        supabaseServer.from('deliveries').select('*').order('created_at', { ascending: false }).limit(40),
        supabaseServer.from('products').select('*').limit(30),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          role: 'admin',
          users: usersRes.data || [],
          deliveries: deliveriesRes.data || [],
          products: productsRes.data || [],
          username: user.username,
        },
      });
    }

    const isUser = true; // customer, driver, partner
    let userData: any = {};
    let deliveries: any[] = [];

    // Get user profile if user is querying their own data or admin
    if (isUser) {
      const { data: userProfile, error: userError } = await supabaseServer
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userError && userProfile) {
        userData = userProfile;
      }
    }

    // Query deliveries based on role
    let deliveriesQuery = supabaseServer
      .from('deliveries')
      .select('*');

    if (isUser) {
      // Regular users can only see their own deliveries
      deliveriesQuery = deliveriesQuery.eq('user_id', user.id);
    }

    // Apply filters if query is provided
    if (query && typeof query === 'string') {
      const lowerQuery = query.toLowerCase();

      if (isUser) {
        // For users, search within their deliveries
        deliveriesQuery = deliveriesQuery.or(
          `order_number.ilike.%${lowerQuery}%,status.ilike.%${lowerQuery}%`
        );
      } else {
        // Admin can search across all deliveries
        deliveriesQuery = deliveriesQuery.or(
          `order_number.ilike.%${lowerQuery}%,status.ilike.%${lowerQuery}%,user_id.ilike.%${lowerQuery}%`
        );
      }
    }

    const { data: deliveriesData, error: deliveriesError } = await deliveriesQuery;

    if (!deliveriesError && deliveriesData) {
      deliveries = deliveriesData;
    }

    // Get products related to the deliveries
    const productIds = deliveries
      .filter(d => d.product_id)
      .map(d => d.product_id);

    let products: any[] = [];
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabaseServer
        .from('products')
        .select('*')
        .in('id', [...new Set(productIds)]);

      if (!productsError && productsData) {
        products = productsData;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: isUser ? userData : null,
        deliveries,
        products,
        role: user.role,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Personal data query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
