-- ══════════════════════════════════════════════════════════════
-- Studio Consapevole — Contatore posti mensili
-- Da eseguire UNA VOLTA nel SQL Editor di Supabase
-- ══════════════════════════════════════════════════════════════

-- Tabella: una riga per ogni iscrizione andata a buon fine.
-- Non conserva nome/email (già su Formspree): serve solo a contare.
create table if not exists posti_studio (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  mese_chiave text not null  -- es. '2026-07'
);

-- Sicurezza: nessuno può leggere la tabella direttamente,
-- ma chiunque (anche il sito pubblico) può inserire una riga.
alter table posti_studio enable row level security;

create policy "chiunque puo inserire"
  on posti_studio for insert
  to anon
  with check (true);

-- Nessuna policy di SELECT = la tabella non è leggibile dall'esterno.
-- Il conteggio pubblico passa SOLO da questa funzione, che restituisce
-- un numero (non i dati), quindi resta tutto privato.
create or replace function conta_posti_mese(chiave text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from posti_studio where mese_chiave = chiave;
$$;

grant execute on function conta_posti_mese(text) to anon;
