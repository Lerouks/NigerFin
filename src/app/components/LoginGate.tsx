import { useState } from 'react';
import { X } from 'lucide-react';

interface LoginGateProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  articleTitle: string;
}

export function LoginGate({ isOpen, onClose, onLogin, articleTitle }: LoginGateProps) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Contenu Premium</h2>
          <p className="text-gray-600 text-sm">
            Connectez-vous pour lire l'article complet
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{articleTitle}</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full border border-black/[0.08] rounded-lg px-4 py-2.5 focus:outline-none focus:border-black/20 focus:ring-1 focus:ring-black/10 bg-[#fafaf9] transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-[#111] text-white py-3 rounded-lg hover:bg-[#333] transition-colors"
        >
          Se connecter
        </button>

        <div className="mt-6 pt-6 border-t border-black/[0.05]">
          <p className="text-xs text-gray-500 text-center">
            Pas encore de compte ?{' '}
            <button
              onClick={handleLogin}
              className="text-black font-medium hover:underline"
            >
              Créer un compte gratuitement
            </button>
          </p>
        </div>

        <div className="mt-6 bg-[#fafaf9] p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Avec un compte NFI REPORT :</h4>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li>✓ Accès illimité aux articles premium</li>
            <li>✓ Commentez et interagissez avec la communauté</li>
            <li>✓ Recevez notre newsletter quotidienne</li>
            <li>✓ Suivez les sujets qui vous intéressent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}