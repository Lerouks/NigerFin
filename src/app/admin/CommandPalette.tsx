'use client';

import { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  LayoutDashboard,
  Newspaper,
  FileText,
  MessageSquare,
  Zap,
  BookOpen,
  Users,
  User as UserIcon,
  Mail,
  BarChart3,
  Wallet,
  Receipt,
  Tag,
  Lock,
  Archive,
  Server,
  Send,
  Trash2,
  Activity,
  LogOut,
  CornerDownLeft,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RouteCommand {
  href: string;
  label: string;
  group: string;
  icon: LucideIcon;
  keywords: string;
}

interface UserResult {
  id: string;
  email: string;
  fullName: string;
  role: string;
  initials: string;
}

interface ArticleResult {
  id: string;
  slug: string;
  title: string;
  contentType: string | null;
  publishedAt: string | null;
}

const ROUTES: RouteCommand[] = [
  { href: '/admin', label: 'Cockpit', group: 'Cockpit', icon: LayoutDashboard, keywords: 'home dashboard accueil' },
  { href: '/admin/contenu', label: 'Contenu', group: 'Contenu', icon: Newspaper, keywords: 'contenu editorial' },
  { href: '/admin/contenu/articles', label: 'Articles', group: 'Contenu', icon: FileText, keywords: 'articles redaction publier' },
  { href: '/admin/contenu/commentaires', label: 'Commentaires', group: 'Contenu', icon: MessageSquare, keywords: 'commentaires moderation' },
  { href: '/admin/contenu/flash', label: 'Flash', group: 'Contenu', icon: Zap, keywords: 'flash banniere alerte' },
  { href: '/admin/contenu/education', label: 'Education', group: 'Contenu', icon: BookOpen, keywords: 'education cours pedagogie' },
  { href: '/admin/contenu/pages', label: 'Pages', group: 'Contenu', icon: FileText, keywords: 'pages legales mentions' },
  { href: '/admin/audience', label: 'Audience', group: 'Audience', icon: Users, keywords: 'audience lecteurs' },
  { href: '/admin/audience/utilisateurs', label: 'Utilisateurs', group: 'Audience', icon: UserIcon, keywords: 'utilisateurs comptes users' },
  { href: '/admin/audience/messages', label: 'Messages', group: 'Audience', icon: Mail, keywords: 'messages contact' },
  { href: '/admin/audience/statistiques', label: 'Statistiques', group: 'Audience', icon: BarChart3, keywords: 'stats analytics audience' },
  { href: '/admin/argent', label: 'Argent', group: 'Argent', icon: Wallet, keywords: 'argent monetisation revenus' },
  { href: '/admin/argent/paiements', label: 'Paiements', group: 'Argent', icon: Receipt, keywords: 'paiements transactions ipaymoney' },
  { href: '/admin/argent/tarifs', label: 'Tarifs', group: 'Argent', icon: Tag, keywords: 'tarifs prix pricing premium' },
  { href: '/admin/argent/paywall', label: 'Paywall', group: 'Argent', icon: Lock, keywords: 'paywall premium acces' },
  { href: '/admin/newsletter', label: 'Newsletter', group: 'Diffusion', icon: Mail, keywords: 'newsletter envoi resend' },
  { href: '/admin/site', label: 'Site', group: 'Diffusion', icon: Server, keywords: 'site sante features' },
  { href: '/admin/legacy', label: 'Ancien tableau de bord', group: 'Diffusion', icon: Archive, keywords: 'legacy ancien dashboard' },
];

const DEBOUNCE_MS = 200;
const MIN_QUERY = 2;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const usersAbortRef = useRef<AbortController | null>(null);
  const articlesAbortRef = useRef<AbortController | null>(null);

  // Debounce du query input pour ne pas spammer les endpoints Supabase.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Reset state quand on ferme le palette.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebouncedQuery('');
      setUsers([]);
      setArticles([]);
      setToast(null);
      usersAbortRef.current?.abort();
      articlesAbortRef.current?.abort();
    }
  }, [open]);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch users + articles quand query >= MIN_QUERY caracteres.
  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery;
    if (q.length < MIN_QUERY) {
      setUsers([]);
      setArticles([]);
      return;
    }

    setLoadingRemote(true);
    usersAbortRef.current?.abort();
    articlesAbortRef.current?.abort();

    const usersCtrl = new AbortController();
    const articlesCtrl = new AbortController();
    usersAbortRef.current = usersCtrl;
    articlesAbortRef.current = articlesCtrl;

    const usersPromise = fetchUsers(q, usersCtrl.signal)
      .then(setUsers)
      .catch((err: unknown) => {
        if (!isAbortError(err)) setUsers([]);
      });

    const articlesPromise = fetchArticles(q, articlesCtrl.signal)
      .then(setArticles)
      .catch((err: unknown) => {
        if (!isAbortError(err)) setArticles([]);
      });

    Promise.all([usersPromise, articlesPromise]).finally(() => {
      setLoadingRemote(false);
    });

    return () => {
      usersCtrl.abort();
      articlesCtrl.abort();
    };
  }, [debouncedQuery, open]);

  const navigateAndClose = (href: string, openInNewTab = false) => {
    if (openInNewTab && typeof window !== 'undefined') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
    onOpenChange(false);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      // signOut peut echouer si Supabase est inaccessible ; on continue le
      // redirect cote client malgre tout (la session sera invalidee a la
      // prochaine requete API). Capture Sentry pour suivi.
      Sentry.captureException(err, { tags: { context: 'admin-logout' } });
    }
    router.push('/');
  };

  // Ferme avec Escape (gere aussi par Dialog mais on est defensifs).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const showAlwaysSections = debouncedQuery.length === 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Recherche et commandes du Cockpit"
      shouldFilter={true}
      // Force le filtrage cmdk pour la liste de routes/actions; les resultats users/articles
      // sont deja filtres cote serveur, on les expose en forcant un score eleve via keywords.
    >
      <div
        className="fixed inset-0 z-100 bg-black/40 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <div
          className="w-full max-w-2xl bg-white rounded-2xl border border-black/8 shadow-2xl overflow-hidden mt-4 sm:mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/6">
            <Search className="w-[18px] h-[18px] text-foreground/45 shrink-0" aria-hidden="true" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              autoFocus
              placeholder="Cherche un utilisateur, un article, une route..."
              className="flex-1 bg-transparent outline-hidden text-[14px] placeholder:text-foreground/35 text-foreground"
              aria-label="Recherche du Cockpit"
            />
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-black/5 text-foreground/55 border border-black/6">
              ESC
            </kbd>
          </div>

          <Command.List
            className="max-h-[60vh] sm:max-h-96 overflow-y-auto py-2"
            aria-live="polite"
          >
            <Command.Empty className="px-4 py-8 text-center text-[13px] text-foreground/50">
              {loadingRemote ? 'Recherche en cours...' : 'Aucun resultat. Essaye un autre mot.'}
            </Command.Empty>

            {showAlwaysSections && (
              <Command.Group heading="Aller a" className="px-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-foreground/45 **:[[cmdk-group-heading]]:font-semibold">
                {ROUTES.map((route) => (
                  <RouteItem
                    key={route.href}
                    route={route}
                    onSelect={(openInNewTab) => navigateAndClose(route.href, openInNewTab)}
                  />
                ))}
              </Command.Group>
            )}

            {!showAlwaysSections && (
              <Command.Group heading="Routes" className="px-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-foreground/45 **:[[cmdk-group-heading]]:font-semibold">
                {ROUTES.map((route) => (
                  <RouteItem
                    key={route.href}
                    route={route}
                    onSelect={(openInNewTab) => navigateAndClose(route.href, openInNewTab)}
                  />
                ))}
              </Command.Group>
            )}

            {debouncedQuery.length >= MIN_QUERY && users.length > 0 && (
              <Command.Group
                heading="Utilisateurs"
                className="px-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-foreground/45 **:[[cmdk-group-heading]]:font-semibold"
              >
                {users.map((u) => (
                  <UserItem
                    key={u.id}
                    user={u}
                    onSelect={(openInNewTab) =>
                      navigateAndClose(`/admin/audience/utilisateurs?user=${u.id}`, openInNewTab)
                    }
                  />
                ))}
              </Command.Group>
            )}

            {debouncedQuery.length >= MIN_QUERY && articles.length > 0 && (
              <Command.Group
                heading="Articles"
                className="px-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-foreground/45 **:[[cmdk-group-heading]]:font-semibold"
              >
                {articles.map((a) => (
                  <ArticleItem
                    key={a.id}
                    article={a}
                    onSelect={(openInNewTab) =>
                      navigateAndClose(`/admin/contenu/articles?article=${a.slug}`, openInNewTab)
                    }
                  />
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Actions"
              className="px-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-foreground/45 **:[[cmdk-group-heading]]:font-semibold"
            >
              <ActionItem
                icon={Send}
                label="Envoyer le briefing du jour maintenant"
                keywords="briefing envoi push notification"
                onSelect={() => {
                  setToast('Bientot disponible');
                }}
              />
              <ActionItem
                icon={Trash2}
                label="Vider le cache du site"
                keywords="cache vider purge revalidate"
                onSelect={() => {
                  setToast('Bientot disponible');
                }}
              />
              <ActionItem
                icon={Activity}
                label="Voir la sante du site"
                keywords="sante site health monitoring"
                onSelect={() => navigateAndClose('/admin/site')}
              />
              <ActionItem
                icon={LogOut}
                label="Deconnexion"
                keywords="deconnexion logout signout quitter"
                onSelect={() => {
                  void handleLogout();
                }}
              />
            </Command.Group>
          </Command.List>

          <div className="hidden sm:flex items-center justify-between px-4 py-2 border-t border-black/6 text-[11px] text-foreground/45 bg-background">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" aria-hidden="true" /> Selectionner
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="font-mono px-1 rounded-sm bg-white border border-black/8">Cmd</kbd>
                <kbd className="font-mono px-1 rounded-sm bg-white border border-black/8">Enter</kbd>
                Nouvel onglet
              </span>
            </div>
            <span>NFI Cockpit</span>
          </div>

          {toast && (
            <div
              role="status"
              aria-live="polite"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-white text-[12px] px-3 py-2 rounded-lg shadow-lg"
            >
              {toast}
            </div>
          )}
        </div>
      </div>
    </Command.Dialog>
  );
}

// --- Items ---------------------------------------------------------------

function RouteItem({
  route,
  onSelect,
}: {
  route: RouteCommand;
  onSelect: (openInNewTab: boolean) => void;
}) {
  const Icon = route.icon;
  return (
    <Command.Item
      value={`${route.label} ${route.group} ${route.keywords} ${route.href}`}
      onSelect={() => onSelect(false)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground cursor-pointer aria-selected:bg-black/4 hover:bg-black/3 transition data-[selected=true]:bg-black/4"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSelect(true);
        }
      }}
    >
      <span className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center shrink-0">
        <Icon className="w-[16px] h-[16px] text-foreground/70" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{route.label}</p>
        <p className="text-[11px] text-foreground/45 truncate">{route.group} . {route.href}</p>
      </div>
    </Command.Item>
  );
}

function UserItem({
  user,
  onSelect,
}: {
  user: UserResult;
  onSelect: (openInNewTab: boolean) => void;
}) {
  const tierLabel = tierLabelFor(user.role);
  const tierStyle = tierStyleFor(user.role);
  return (
    <Command.Item
      // Score eleve garanti pour les resultats serveur via le terme exact email+name.
      value={`user ${user.email} ${user.fullName} ${user.id}`}
      onSelect={() => onSelect(false)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] cursor-pointer aria-selected:bg-black/4 hover:bg-black/3 transition data-[selected=true]:bg-black/4"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSelect(true);
        }
      }}
    >
      <span className="w-8 h-8 rounded-full bg-linear-to-br from-[#d4a843] to-[#ff8c42] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
        {user.initials}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{user.fullName || 'Sans nom'}</p>
        <p className="text-[11px] text-foreground/45 truncate">{user.email}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${tierStyle}`}>
        {tierLabel}
      </span>
    </Command.Item>
  );
}

function ArticleItem({
  article,
  onSelect,
}: {
  article: ArticleResult;
  onSelect: (openInNewTab: boolean) => void;
}) {
  const status = article.publishedAt ? 'Publie' : 'Brouillon';
  const statusStyle = article.publishedAt
    ? 'bg-[#00c805]/12 text-[#00a004]'
    : 'bg-black/6 text-foreground/55';
  const relative = formatRelative(article.publishedAt);
  return (
    <Command.Item
      value={`article ${article.title} ${article.slug}`}
      onSelect={() => onSelect(false)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] cursor-pointer aria-selected:bg-black/4 hover:bg-black/3 transition data-[selected=true]:bg-black/4"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSelect(true);
        }
      }}
    >
      <span className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center shrink-0">
        <Newspaper className="w-[16px] h-[16px] text-foreground/70" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{article.title}</p>
        <p className="text-[11px] text-foreground/45 truncate">{relative}</p>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${statusStyle}`}>
        {status}
      </span>
    </Command.Item>
  );
}

function ActionItem({
  icon: Icon,
  label,
  keywords,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  keywords: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`action ${label} ${keywords}`}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground cursor-pointer aria-selected:bg-black/4 hover:bg-black/3 transition data-[selected=true]:bg-black/4"
    >
      <span className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center shrink-0">
        <Icon className="w-[16px] h-[16px] text-foreground/70" aria-hidden="true" />
      </span>
      <p className="font-medium truncate">{label}</p>
    </Command.Item>
  );
}

// --- Helpers --------------------------------------------------------------

async function fetchUsers(q: string, signal: AbortSignal): Promise<UserResult[]> {
  const url = `/api/admin/users?search=${encodeURIComponent(q)}&limit=8`;
  const res = await fetch(url, { credentials: 'same-origin', signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: RawUser[] } | RawUser[];
  const list: RawUser[] = Array.isArray(json) ? json : json.data ?? [];
  return list.slice(0, 8).map(toUserResult);
}

interface RawUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
}

function toUserResult(u: RawUser): UserResult {
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name ?? '',
    role: u.role ?? 'reader',
    initials: initialsFrom(u.full_name, u.email),
  };
}

function initialsFrom(fullName: string | null, email: string): string {
  const source = (fullName ?? '').trim();
  if (source.length > 0) {
    const parts = source.split(/\s+/).filter(Boolean);
    const first = parts[0];
    const second = parts[1];
    if (first && second) return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
  }
  const at = email.indexOf('@');
  const handle = at > 0 ? email.slice(0, at) : email;
  return handle.slice(0, 2).toUpperCase();
}

async function fetchArticles(q: string, signal: AbortSignal): Promise<ArticleResult[]> {
  const url = `/api/admin/articles/search?q=${encodeURIComponent(q)}&limit=6`;
  const res = await fetch(url, { credentials: 'same-origin', signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { articles?: RawArticle[] };
  const list = json.articles ?? [];
  return list.slice(0, 6).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    contentType: a.contentType ?? null,
    publishedAt: a.publishedAt ?? null,
  }));
}

interface RawArticle {
  id: string;
  slug: string;
  title: string;
  contentType?: string | null;
  publishedAt?: string | null;
}

function tierLabelFor(role: string): string {
  if (role === 'admin') return 'Admin';
  if (role === 'premium') return 'Premium';
  return 'Free';
}

function tierStyleFor(role: string): string {
  if (role === 'admin') return 'bg-foreground text-[#d4a843]';
  if (role === 'premium') return 'bg-linear-to-br from-[#d4a843]/15 to-[#ff8c42]/10 text-[#a07a1f]';
  return 'bg-black/6 text-foreground/55';
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Non publie';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Date inconnue';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'Programme';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'AbortError') return true;
  return false;
}
