import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/ebooks')({ component: () => <Outlet /> });