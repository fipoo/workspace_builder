import {
  Archive, Armchair, ArrowDownToLine, ArrowUpToLine, Backpack, Bean, Bike, Boxes, Briefcase, CircleDot,
  CloudRain, Coffee, Cog, Cookie, CookingPot, Crown, CupSoda, Drill, Droplet, Fan, Flame, FoldHorizontal,
  Gamepad, Gamepad2, Gem, GlassWater, Grid3x3, Hammer, Hand, HardHat, Keyboard, LampDesk, LampFloor, Laptop,
  Layers, LayoutGrid, LayoutPanelLeft, Leaf, LeafyGreen, Minimize2, Monitor, Motorbike, Mouse, Package,
  PersonStanding, RectangleHorizontal, Refrigerator, Scooter, ShelvingUnit, Sofa, Speaker, Sprout, Square,
  Table, Table2, TentTree, TrainTrack, TreeDeciduous, TreePalm, TvMinimal, Umbrella, Waves, Webcam, Wrench,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Archive, Armchair, ArrowDownToLine, ArrowUpToLine, Backpack, Bean, Bike, Boxes, Briefcase, CircleDot,
  CloudRain, Coffee, Cog, Cookie, CookingPot, Crown, CupSoda, Drill, Droplet, Fan, Flame, FoldHorizontal,
  Gamepad, Gamepad2, Gem, GlassWater, Grid3x3, Hammer, Hand, HardHat, Keyboard, LampDesk, LampFloor, Laptop,
  Layers, LayoutGrid, LayoutPanelLeft, Leaf, LeafyGreen, Minimize2, Monitor, Motorbike, Mouse, Package,
  PersonStanding, RectangleHorizontal, Refrigerator, Scooter, ShelvingUnit, Sofa, Speaker, Sprout, Square,
  Table, Table2, TentTree, TrainTrack, TreeDeciduous, TreePalm, TvMinimal, Umbrella, Waves, Webcam, Wrench,
};

/** Renders a lucide icon by name, falling back to the emoji when the icon is unknown. */
export function ItemIcon({
  icon,
  emoji,
  size = 24,
  className,
  strokeWidth = 2,
}: {
  icon: string;
  emoji: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[icon];
  if (!Icon) {
    return (
      <span aria-hidden className={className} style={{ fontSize: size * 0.9, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }
  return <Icon aria-hidden size={size} strokeWidth={strokeWidth} className={className} />;
}
