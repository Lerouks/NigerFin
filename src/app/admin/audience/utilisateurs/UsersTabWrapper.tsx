'use client';

import { useCallback } from 'react';
import { UsersTab } from '../../UsersTab';

export function UsersTabWrapper() {
  const handleStatsRefresh = useCallback(() => {
    // Le tableau de bord global se rafraichit via SWR polling sur /api/admin/overview.
    // Pas besoin d'action explicite ici, mais on garde le hook pour les actions
    // UsersTab qui appellent onStatsRefresh apres mutation (block, premium, etc.).
  }, []);

  return <UsersTab onStatsRefresh={handleStatsRefresh} />;
}
