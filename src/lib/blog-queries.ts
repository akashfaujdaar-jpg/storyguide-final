import { queryOptions } from '@tanstack/react-query';
import { getPublishedPosts } from './blog.functions';
export const blogQuery = queryOptions({ queryKey: ['published-blog'], queryFn: () => getPublishedPosts(), staleTime: 60000 });