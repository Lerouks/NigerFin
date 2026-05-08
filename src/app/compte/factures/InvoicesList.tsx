import Link from 'next/link';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  amount_xof: number;
  currency: string;
  status: string;
  paid_at: string | null;
  billing_cycle: string | null;
  period_start: string | null;
  period_end: string | null;
  pdf_path: string | null;
  created_at: string;
}

function formatDateFr(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

function statusBadge(status: string): { label: string; classes: string } {
  switch (status) {
    case 'paid':
      return { label: 'Payée', classes: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { label: 'Annulée', classes: 'bg-red-100 text-red-800' };
    case 'refunded':
      return { label: 'Remboursée', classes: 'bg-amber-100 text-amber-800' };
    case 'draft':
      return { label: 'Brouillon', classes: 'bg-neutral-100 text-neutral-700' };
    default:
      return { label: status, classes: 'bg-neutral-100 text-neutral-700' };
  }
}

export function InvoicesList({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 px-6 py-16 text-center">
        <p className="text-base text-foreground/70">Vous n&apos;avez encore aucune facture.</p>
        <p className="mt-2 text-sm text-foreground/55">
          Les factures de vos abonnements Premium apparaîtront ici dès le premier paiement validé.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          Découvrir Premium
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Desktop / tablet */}
      <table className="hidden w-full text-left sm:table">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Numéro</th>
            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Date</th>
            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Période</th>
            <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Montant</th>
            <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Statut</th>
            <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground/60">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {invoices.map((inv) => {
            const badge = statusBadge(inv.status);
            const period = inv.period_start && inv.period_end
              ? `${formatDateFr(inv.period_start)} → ${formatDateFr(inv.period_end)}`
              : '—';
            return (
              <tr key={inv.id} className="hover:bg-neutral-50/50">
                <td className="px-5 py-4 font-mono text-sm font-medium text-foreground tabular-nums">{inv.invoice_number}</td>
                <td className="px-5 py-4 text-sm text-foreground/70">{formatDateFr(inv.paid_at ?? inv.created_at)}</td>
                <td className="px-5 py-4 text-xs text-foreground/55">{period}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-foreground">{formatXof(inv.amount_xof)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.classes}`}>{badge.label}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  {inv.pdf_path ? (
                    <a
                      href={`/api/invoices/${inv.id}/download`}
                      className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      Télécharger
                    </a>
                  ) : (
                    <span className="text-sm text-foreground/40">PDF indisponible</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-neutral-100 sm:hidden">
        {invoices.map((inv) => {
          const badge = statusBadge(inv.status);
          return (
            <li key={inv.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium text-foreground tabular-nums">{inv.invoice_number}</p>
                  <p className="mt-0.5 text-xs text-foreground/60">{formatDateFr(inv.paid_at ?? inv.created_at)}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.classes}`}>{badge.label}</span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-base font-semibold tabular-nums text-foreground">{formatXof(inv.amount_xof)}</p>
                {inv.pdf_path ? (
                  <a
                    href={`/api/invoices/${inv.id}/download`}
                    className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Télécharger →
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
