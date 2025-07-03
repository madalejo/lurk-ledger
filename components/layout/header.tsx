'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from "sonner"

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast('Signed out');
    router.push('/login');
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  // Don't show navigation if on auth pages
  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            Twitch Tracker
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className={`text-sm ${isActive('/dashboard') ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/streams"
              className={`text-sm ${isActive('/streams') ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Streams
            </Link>
            <Link
              href="/viewers"
              className={`text-sm ${isActive('/viewers') ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Viewers
            </Link>
            <Link
              href="/settings"
              className={`text-sm ${isActive('/settings') ? 'font-medium' : 'text-muted-foreground'}`}
            >
              Settings
            </Link>
          </nav>
        </div>
        
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}