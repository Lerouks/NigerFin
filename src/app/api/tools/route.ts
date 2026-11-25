import { NextResponse } from 'next/server';

export const revalidate = 300;

const tools = [
  { _id: 'f1', name: "Simulateur d'emprunt", slug: 'emprunt', icon: 'Calculator', isPremium: false },
  { _id: 'f2', name: 'Intérêt simple', slug: 'interets-simples', icon: 'Percent', isPremium: false },
  { _id: 'f3', name: 'Simulateur de salaire', slug: 'salaire', icon: 'DollarSign', isPremium: true },
  { _id: 'f4', name: 'Indices économiques', slug: 'indices-economiques', icon: 'BarChart3', isPremium: false },
  { _id: 'f5', name: 'Intérêt composé', slug: 'interets-composes', icon: 'TrendingUp', isPremium: true },
  { _id: 'f6', name: 'Budget familial', slug: 'budget-familial', icon: 'Wallet', isPremium: true },
];

export async function GET() {
  return NextResponse.json(tools);
}
