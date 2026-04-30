import type { NewsletterIssue } from '@/emails/types';
import { issue001Demo } from './001-fictif';

const REGISTRY: Record<string, NewsletterIssue> = {
  '001-demo': issue001Demo,
};

export function getDemoIssue(slug: string): NewsletterIssue | null {
  return REGISTRY[slug] ?? null;
}

export function listDemoIssueSlugs(): string[] {
  return Object.keys(REGISTRY);
}
