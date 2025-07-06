import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function StreamsPage() {
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
  
  const { data: streams, error } = await supabase
    .from('streams')
    .select('*')
    .eq('user_id', session.user.id)
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching streams:', error);
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Streams</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Stream History</CardTitle>
          <CardDescription>
            A record of your past Twitch streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {streams && streams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streams.map((stream) => (
                  <TableRow key={stream.id}>
                    <TableCell>
                      {new Date(stream.start_time).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{stream.title || 'Untitled Stream'}</TableCell>
                    <TableCell>
                      {stream.end_time
                        ? `${Math.round((new Date(stream.end_time).getTime() - new Date(stream.start_time).getTime()) / (1000 * 60 * 60))} hours`
                        : 'Live'}
                    </TableCell>
                    <TableCell>{stream.category || 'N/A'}</TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/streams/${stream.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No streams found. Connect your Twitch account to start tracking.</p>
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