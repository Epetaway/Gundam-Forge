'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/forge', label: 'Forge' },
  { href: '/explore', label: 'Explore' },
  { href: '/cards', label: 'Cards' },
  { href: '/events', label: 'Events' },
  { href: '/auth/login', label: 'Login' },
] as const;

export function MainNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive ? 'bg-accent text-accent-foreground' : 'text-steel-600 hover:bg-steel-100 hover:text-foreground',
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Open navigation" className="md:hidden" size="icon" variant="secondary">
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {navItems.map((item) => (
            <DropdownMenuItem asChild key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
