import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get stats if user is logged in
  let recentStreams = null;
  let totalViewers = 0;
  let totalWatchTime = 0;

  if (session) {
    const { data: streams } = await supabase
      .from('streams')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })
      .limit(5);
    
    recentStreams = streams;

    const { count: viewersCount } = await supabase
      .from('viewers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    
    totalViewers = viewersCount || 0;

    const { data: watchTimeData } = await supabase
      .from('stream_viewers')
      .select('minutes_watched')
      .eq('user_id', session.user.id);
    
    totalWatchTime = watchTimeData?.reduce((sum, item) => sum + (item.minutes_watched || 0), 0) || 0;
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
          Track and Analyze Your Twitch Viewers
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Understand your audience, identify your most loyal viewers, and grow your community with data-driven insights.
        </p>
        
        {!session ? (
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/streams">View Your Streams</Link>
            </Button>
          </div>
        )}
      </div>

      {session && (
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViewers}</div>
              <p className="text-xs text-muted-foreground">Unique viewers across all streams</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(totalWatchTime / 60)} hours</div>
              <p className="text-xs text-muted-foreground">Total time watched by all viewers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Streams</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentStreams?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Streams in the last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Track Viewer Activity</CardTitle>
            <CardDescription>
              Monitor who watches your streams and for how long.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automatically track when viewers join, how long they watch, and how often they return to your streams.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Identify Loyal Viewers</CardTitle>
            <CardDescription>
              Recognize your most engaged community members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See who consistently watches your streams and contributes to your chat, making it easy to build stronger connections.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Analyze Chat Activity</CardTitle>
            <CardDescription>
              Monitor chat engagement during your streams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track message counts and see which viewers are most active in your chat to better understand your audience.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>View Detailed Stats</CardTitle>
            <CardDescription>
              Get insights about your stream performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See detailed analytics about viewer retention, growth trends, and audience demographics across all your streams.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Viewer Profiles</CardTitle>
            <CardDescription>
              Build comprehensive viewer profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access individual viewer history including watch time, chat activity, and attendance across multiple streams.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Twitch Integration</CardTitle>
            <CardDescription>
              Seamless connection with your Twitch account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect directly with Twitch to automatically track new streams and viewers without any manual setup.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}