'use client';

import Image from 'next/image';
import { useState } from 'react';
import { categoryOf, type Item } from '@/data/catalog';
import { cn } from '@/lib/dnd';
import { ItemIcon } from '@/lib/icons';

type Props = {
  item: Item;
  /** 'cover' fills the box (catalog, zone tiles). 'cutout' keeps the whole product and drops a white
   *  background with multiply, so monis.rent packshots look placed in the scene. */
  fit?: 'cover' | 'cutout' | 'cutout-crop';
  sizes?: string;
  className?: string;
  priority?: boolean;
};

/** Product photo with an icon fallback, so a broken URL never leaves an empty box. */
export function ItemPhoto({ item, fit = 'cover', sizes = '160px', className, priority }: Props) {
  const [failed, setFailed] = useState(false);
  const cat = categoryOf(item);

  if (failed) {
    return (
      <span
        className={cn('grid place-items-center', className)}
        style={{ color: cat.color, backgroundColor: `color-mix(in oklab, ${cat.color} 12%, white)` }}
      >
        <ItemIcon icon={item.icon} emoji={item.emoji} size={22} />
      </span>
    );
  }

  const cutout = fit !== 'cover' && item.source === 'monis';
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes={sizes}
        priority={priority}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn(
          'pointer-events-none select-none',
          fit === 'cutout' ? 'object-contain' : 'object-cover',
          cutout && 'mix-blend-multiply',
        )}
      />
    </span>
  );
}
