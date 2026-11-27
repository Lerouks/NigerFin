// La date d'un article, à l'heure de Niamey pour tout le monde. Sans fuseau,
// le serveur (Vercel, en UTC) et le navigateur du lecteur n'écrivent pas le
// même jour pour un article publié après 23 h UTC, et React rejette alors la
// page rendue par le serveur (erreur 418). Le premier du mois s'écrit « 1er ».
export function formatDate(dateString: string): string {
  return new Date(dateString)
    .toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Niamey',
    })
    .replace(/^1 /, '1er ');
}

export function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}