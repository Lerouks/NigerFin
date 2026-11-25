/**
 * Image de partage d'Apprendre (WhatsApp, Facebook) : fond noir, le titre en
 * grand, le cours et la leçon en dessous, la marque en haut. Palette du logo,
 * sans dégradé ni surtitre en capitales espacées.
 */
export function visuelPartage({ titre, ligne }: { titre: string; ligne: string }) {
  const titreCourt = titre.length > 110 ? `${titre.slice(0, 107)}…` : titre;
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#111111',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px' }}>
        <div style={{ color: '#ffffff', fontSize: '30px', fontWeight: 800, letterSpacing: '0.02em' }}>NFI REPORT</div>
        <div style={{ color: '#8a8e95', fontSize: '26px' }}>Apprendre</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1040px' }}>
        <div style={{ color: '#ffffff', fontSize: titreCourt.length > 60 ? '56px' : '68px', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
          {titreCourt}
        </div>
        <div style={{ color: '#a9adb4', fontSize: '28px', lineHeight: 1.35 }}>{ligne}</div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.14)', paddingTop: '26px', color: '#8a8e95', fontSize: '22px' }}>
        nfireport.com/apprendre
      </div>
    </div>
  );
}
