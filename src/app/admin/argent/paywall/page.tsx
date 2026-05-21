import type { Metadata } from 'next';
import { PaywallManager } from '../../PaywallManager';

export const metadata: Metadata = {
  title: 'Paywall · NFI Cockpit',
  description: 'Configuration du paywall Premium.',
  robots: { index: false },
};

export default function ArgentPaywallPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Paywall</h1>
      <PaywallManager />
    </div>
  );
}
