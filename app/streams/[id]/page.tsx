import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Props = {
  params: { id: string }
}

export default async function StreamDetailPage({ params }: Props) {
  const { id } = params;
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
  
  const { data: stream, error: streamError } = await supabase
    .from('streams')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();
  
  if (streamError || !stream) {
    return notFound();
  }
  
  const { data: streamViewers, error: viewersError } = await supabase
    .from('stream_viewers')
    .select(`
      id,
      first_seen,
      last_seen,
      minutes_watched,
      chat_messages,
      viewers (
        id,
        username,
        viewer_type
      )
    `)
    .eq('stream_id', id)
    .order('minutes_watched', { ascending: false });
  
  if (viewersError) {
    console.error('Error fetching stream viewers:', viewersError);
  }
  
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Stream Details</h1>
        <Button asChild variant="outline">
          <Link href="/streams">Back to Streams</Link>
        </Button>
      </div>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{stream.title || 'Untitled Stream'}</CardTitle>
            <CardDescription>
              {new Date(stream.start_time).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-xl font-semibold">
                  {stream.end_time
                    ? `${Math.round((new Date(stream.end_time).getTime() - new Date(stream.start_time).getTime()) / (1000 * 60 * 60))} hours`
                    : 'Live'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-xl font-semibold">{stream.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Viewers</p>
                <p className="text-xl font-semibold">{streamViewers?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Viewers</CardTitle>
          <CardDescription>
            Viewers who watched this stream
          </CardDescription>
        </CardHeader>
        <CardContent>
          {streamViewers && streamViewers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time Watched</TableHead>
                  <TableHead>Chat Messages</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streamViewers.map((viewer) => (
                  <TableRow key={viewer.id}>
                    <TableCell>{viewer.viewers[0].username}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        viewer.viewers[0].viewer_type === 'subscriber' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                          : viewer.viewers[0].viewer_type === 'follower'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {viewer.viewers[0].viewer_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {Math.round(viewer.minutes_watched)} min
                    </TableCell>
                    <TableCell>{viewer.chat_messages}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/viewers/${viewer.viewers[0].id}`}>View Profile</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No viewer data available for this stream.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}