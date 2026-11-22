import { NextResponse } from 'next/server';

export const revalidate = 300;

const tools = [
  { _id: 'f1', name: "Simulateur d'emprunt", slug: 'simulateur-emprunt', icon: 'Calculator', isPremium: false },
  { _id: 'f2', name: 'Intérêt simple', slug: 'interet-simple', icon: 'Percent', isPremium: false },
  { _id: 'f3', name: 'Simulateur de salaire', slug: 'simulateur-salaire', icon: 'DollarSign', isPremium: true },
  { _id: 'f4', name: 'Indices économiques', slug: 'indices-economiques', icon: 'BarChart3', isPremium: false },
  { _id: 'f5', name: 'Intérêt composé', slug: 'interet-compose', icon: 'TrendingUp', isPremium: true },
  { _id: 'f6', name: 'Budget familial', slug: 'budget-familial', icon: 'Wallet', isPremium: true },
];

export async function GET() {
  return NextResponse.json(tools);
}
