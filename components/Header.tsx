'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { formatIDR, formatIDRShort } from '@/lib/pricing';
import { selectCount, selectTotal, useSetup } from '@/store/useSetup';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="monis.rent home">
      <span className="relative grid size-9 place-items-center rounded-xl bg-jungle-900 font-display text-lg font-extrabold text-sand-50 shadow-tile">
        m
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-sunset-500 ring-2 ring-sand-100" />
      </span>
      <span className="hidden font-display text-sm font-bold tracking-tight text-jungle-800/70 sm:block">monis.rent</span>
    </Link>
  );
}

export function Header({ title = 'Design Your Workspace' }: { title?: string }) {
  const count = useSetup(selectCount);
  const total = useSetup(selectTotal);
  const duration = useSetup((s) => s.duration);
  const per = duration === 'week' ? '/wk' : duration === 'quarter' ? '/3mo' : '/mo';

  return (
    <header className="sticky top-0 z-40 border-b border-jungle-900/5 bg-sand-100/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Logo />
        <h1 className="line-clamp-2 min-w-0 flex-1 font-display text-base leading-tight font-extrabold tracking-tight sm:text-2xl">
          {title}
        </h1>
        <Link
          href="/checkout"
          aria-label={`Cart: ${count} items, ${formatIDR(total)}`}
          className="flex items-center gap-2 rounded-full bg-jungle-900 py-1.5 pl-2 pr-3.5 text-sm font-semibold text-sand-50 shadow-tile transition hover:bg-jungle-800 active:scale-95"
        >
          <span className="relative grid size-7 place-items-center rounded-full bg-sand-50/15">
            <ShoppingBag size={15} aria-hidden />
          </span>
          <motion.span
            key={count}
            initial={{ scale: 1.5, color: '#ef8a5c' }}
            animate={{ scale: 1, color: '#fdf8f1' }}
            className="tabular-nums"
          >
            {count}
          </motion.span>
          <span className="text-sand-50/40">·</span>
          <span className="tabular-nums">
            <span className="sm:hidden">{formatIDRShort(total)}</span>
            <span className="hidden sm:inline">{formatIDR(total)}</span>
            <span className="text-xs font-medium text-sand-50/60">{per}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
