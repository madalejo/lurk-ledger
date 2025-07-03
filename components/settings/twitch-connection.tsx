'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TwitchConnection({ userData }: { userData: any }) {
  const [isConnected, setIsConnected] = useState(false);
  

  useEffect(() => {
    setIsConnected(!!userData?.twitch_username);
  }, [userData]);

  const connectToTwitch = () => {
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitch/auth`;
    const scopes = 'user:read:email channel:read:subscriptions moderator:read:followers';
    
    window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  };

  const disconnectFromTwitch = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          twitch_username: null,
          twitch_id: null,
        })
        .eq('id', userData.id);
      
      if (error) {
        throw error
    };
      
      // Also delete tokens
      await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userData.id)
        .eq('provider', 'twitch');
      
      setIsConnected(false);
      toast('Disconnected from Twitch');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('Error');
      console.error(error.message)
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Twitch Connection</CardTitle>
        <CardDescription>
          Connect your Twitch account to track viewer statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="font-medium">Connected as:</p>
                <p className="text-sm text-muted-foreground">{userData.twitch_username}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You need to connect your Twitch account to use the viewer tracking features.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button variant="destructive" onClick={disconnectFromTwitch}>
            Disconnect from Twitch
          </Button>
        ) : (
          <Button onClick={connectToTwitch}>
            Connect with Twitch
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}