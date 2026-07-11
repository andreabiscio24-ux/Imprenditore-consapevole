window.addEventListener('scroll', () => {
  document.getElementById('c-navbar')
    .classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

/* ══════════════════════════════════════════════════════════════
   CONTATORE POSTI MENSILE — reale, tramite Supabase
   ──────────────────────────────────────────────────────────────
   Ogni iscrizione andata a buon fine registra una riga nel database
   Supabase con la chiave del mese corrente (es. "2026-07"). Il conteggio
   pubblico passa da una funzione RPC che restituisce SOLO il numero,
   non i dati delle persone (restano privati, leggibili solo da Andrea
   nella dashboard Supabase).

   Cambio mese automatico: la chiave include anno+mese, quindi ogni
   mese nuovo il conteggio riparte da 0 senza bisogno di toccare nulla.

   ⚠️ CONFIGURAZIONE RICHIESTA — vedi supabase-setup.sql
   Inserisci qui sotto Project URL e anon public key da:
   Supabase → Project Settings → API */

const SUPABASE_URL = 'INSERISCI_QUI_IL_TUO_PROJECT_URL'; // es. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'INSERISCI_QUI_LA_TUA_ANON_KEY';

const POSTI_MAX = 10;
const SUPABASE_CONFIGURATO = !SUPABASE_URL.startsWith('INSERISCI') && !SUPABASE_ANON_KEY.startsWith('INSERISCI');

function meseAnnoCorrente() {
  const oggi = new Date();
  return { anno: oggi.getFullYear(), meseIndex: oggi.getMonth() };
}

function nomeMese(meseIndex, anno, offsetMesi = 0) {
  const d = new Date(anno, meseIndex + offsetMesi, 1);
  const nome = d.toLocaleDateString('it-IT', { month: 'long' });
  return { nome: nome.charAt(0).toUpperCase() + nome.slice(1), anno: d.getFullYear() };
}

function chiaveMese(anno, meseIndex) {
  return `${anno}-${String(meseIndex + 1).padStart(2, '0')}`;
}

async function leggiContatore(chiave) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/conta_posti_mese`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ chiave })
  });
  if (!res.ok) throw new Error('conteggio non disponibile');
  return await res.json(); // la funzione restituisce direttamente un numero
}

async function registraIscrizione(chiave) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/posti_studio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ mese_chiave: chiave })
  });
  return res.ok;
}

function renderLabel(count) {
  const label = document.getElementById('posti-label');
  if (!label) return;

  const { anno, meseIndex } = meseAnnoCorrente();
  const meseCorrente = nomeMese(meseIndex, anno);

  if (count === null) {
    // Supabase non configurato o non raggiungibile: messaggio generico, pagina non si rompe.
    label.textContent = `Apertura ${meseCorrente.nome} ${meseCorrente.anno} — max ${POSTI_MAX} nuovi posti al mese`;
    return;
  }

  if (count >= POSTI_MAX) {
    const meseProssimo = nomeMese(meseIndex, anno, 1);
    label.textContent = `I ${POSTI_MAX} posti di ${meseCorrente.nome} sono già stati richiesti — lasciando i tuoi dati entri in lista per ${meseProssimo.nome}`;
  } else {
    const rimasti = POSTI_MAX - count;
    label.textContent = `Apertura ${meseCorrente.nome} ${meseCorrente.anno} — ${rimasti} ${rimasti === 1 ? 'posto disponibile' : 'posti disponibili'} su ${POSTI_MAX}`;
  }
}

(async () => {
  if (!SUPABASE_CONFIGURATO) {
    renderLabel(null);
    return;
  }
  const { anno, meseIndex } = meseAnnoCorrente();
  const chiave = chiaveMese(anno, meseIndex);
  try {
    const count = await leggiContatore(chiave);
    renderLabel(count);
  } catch (_) {
    renderLabel(null);
  }
})();

/* ── Invio form + registrazione iscrizione reale ──────────────── */

document.querySelectorAll('.waitlist-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        form.hidden = true;
        form.nextElementSibling.hidden = false;

        if (SUPABASE_CONFIGURATO) {
          const { anno, meseIndex } = meseAnnoCorrente();
          const chiave = chiaveMese(anno, meseIndex);
          try {
            await registraIscrizione(chiave);
            const nuovoConteggio = await leggiContatore(chiave);
            renderLabel(nuovoConteggio);
          } catch (_) {
            /* L'iscrizione su Formspree è comunque andata a buon fine anche se
               il contatore non si aggiorna in tempo reale. */
          }
        }
      } else {
        btn.disabled = false;
      }
    } catch (_) {
      btn.disabled = false;
    }
  });
});
