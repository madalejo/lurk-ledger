import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    // Exchange code for token (this would use Twitch API)
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/auth`,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.message || 'Failed to exchange code for token');
    }

    // Get user info from Twitch
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok || !userData.data || userData.data.length === 0) {
      throw new Error('Failed to get user data from Twitch');
    }

    const twitchUser = userData.data[0];

    // Update user in Supabase
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      throw new Error('Not authenticated');
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        twitch_username: twitchUser.login,
        twitch_id: twitchUser.id,
      })
      .eq('id', authUser.user.id);
      
    if (updateError) {
      throw new Error('Failed to update user data');
    }

    // Store Twitch tokens securely
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: authUser.user.id,
        provider: 'twitch',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });
      
    if (tokenError) {
      throw new Error('Failed to store token data');
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(new URL('/settings?connected=true', request.url));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Twitch auth error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}