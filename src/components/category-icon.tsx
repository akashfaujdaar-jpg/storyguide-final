import { BookOpen, Brain, Sprout, Heart, ChartNoAxesColumnIncreasing } from 'lucide-react';
const icons = { 'stories-fiction': BookOpen, 'mind-psychology': Brain, 'personal-growth': Sprout, 'relationships-life': Heart, 'work-money': ChartNoAxesColumnIncreasing };
export function CategoryIcon({ category }: { category: string }) {
  const Icon = icons[category as keyof typeof icons] ?? BookOpen;
  return <Icon className="category-icon" strokeWidth={1.25} aria-hidden="true" />;
}