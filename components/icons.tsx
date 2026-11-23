import {
  Activity, Apple, Bike, Book, BookHeart, BookOpen, Briefcase, Brain, Coffee, Droplet, Dumbbell, Footprints,
  GraduationCap, Heart, HeartPulse, Home, Moon, Music, Palette, PenLine, Pill, PiggyBank, Plane, ShoppingCart,
  Smile, Sparkles, Sun, Tag, Target, Utensils, Wallet, Wrench, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Dumbbell, Briefcase, BookOpen, BookHeart, Book, Droplet, Footprints, Moon, Sun, Apple, Sparkles, GraduationCap, Wallet,
  Home, HeartPulse, Heart, Activity, Bike, Brain, Coffee, Music, Palette, PenLine, Pill, PiggyBank, Plane, ShoppingCart,
  Smile, Target, Utensils, Wrench, Tag,
};

export const ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, className, size = 18 }: { name: string | null | undefined; className?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || Tag;
  return <Icon className={className} size={size} aria-hidden />;
}
