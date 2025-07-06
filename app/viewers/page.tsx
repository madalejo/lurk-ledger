import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default async function ViewersPage() {
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
  
  if (!session) {
    redirect('/login');
  }
  
  // Get all viewers with total watch time and chat messages across all streams
  const { data: viewers, error } = await supabase
    .from('viewers')
    .select(`
      id,
      username,
      viewer_type,
      first_seen,
      stream_viewers (
        minutes_watched,
        chat_messages
      )
    `)
    .order('first_seen', { ascending: false });
  
  if (error) {
    console.error('Error fetching viewers:', error);
  }
  
  // Calculate total watch time and chat messages for each viewer
  const processedViewers = viewers?.map(viewer => {
    const totalMinutesWatched = viewer.stream_viewers.reduce((sum, sv) => sum + sv.minutes_watched, 0);
    const totalChatMessages = viewer.stream_viewers.reduce((sum, sv) => sum + sv.chat_messages, 0);
    
    return {
      ...viewer,
      totalMinutesWatched,
      totalChatMessages,
    };
  }).sort((a, b) => b.totalMinutesWatched - a.totalMinutesWatched) || [];
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Viewers</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Viewer List</CardTitle>
          <CardDescription>
            All viewers who have watched your streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedViewers && processedViewers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Watch Time</TableHead>
                  <TableHead>Chat Messages</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedViewers.map((viewer) => (
                  <TableRow key={viewer.id}>
                    <TableCell>{viewer.username}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        viewer.viewer_type === 'subscriber' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                          : viewer.viewer_type === 'follower'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {viewer.viewer_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(viewer.first_seen).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {Math.round(viewer.totalMinutesWatched)} min
                    </TableCell>
                    <TableCell>{viewer.totalChatMessages}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/viewers/${viewer.id}`}>View Profile</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No viewer data available yet.</p>
              <Button asChild>
                <Link href="/settings">Connect Twitch</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}