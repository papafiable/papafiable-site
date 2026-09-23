/* Papa Fiable : reçoit le résultat du test + l'e-mail, et les transmet à Systeme.io.
   - La clé API Systeme.io reste côté serveur (variable d'environnement SYSTEME_API_KEY sur Netlify).
   - Crée (ou retrouve) le contact, puis lui ajoute des tags :
       quiz-lead                       (tous ceux qui ont laissé leur e-mail)
       quiz-papa-motive | quiz-papa-transition | quiz-papa-fiable
       quiz-pilier-discipline | quiz-pilier-alimentation | quiz-pilier-mouvement
       quiz-<profil>-<pilier>          (9 combinaisons, ex. quiz-transition-alimentation : sert à envoyer le bon PDF)
   - Dans Systeme.io, une règle d'automatisation « tag ajouté → inscrire à la campagne » lance la séquence d'e-mails.
   - Renseigne aussi le champ personnalisé Systeme.io `url_diagnostic` avec le lien exact du PDF de la personne
     (utilisé par l'e-mail de secours générique, envoyé sur le tag quiz-lead). */

const BASE = (process.env.SYSTEME_API_BASE || "https://api.systeme.io/api").replace(/\/$/, "");
const PROFILES = ["motive", "transition", "fiable"];
const PILLARS = ["discipline", "alimentation", "mouvement"];

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

async function api(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "X-API-Key": process.env.SYSTEME_API_KEY, "Content-Type": "application/json", Accept: "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, ok: res.ok, data };
}

const itemsOf = (d) => (Array.isArray(d) ? d : (d && (d.items || d["hydra:member"] || d.data)) || []);

async function findContactByEmail(email) {
  const r = await api(`/contacts?email=${encodeURIComponent(email)}`);
  if (!r.ok) return null;
  const hit = itemsOf(r.data).find((c) => String(c.email || "").toLowerCase() === email.toLowerCase());
  return hit || null;
}

async function ensureContact(email, firstName) {
  const body = { email, locale: "fr" };
  if (firstName) body.fields = [{ slug: "first_name", value: firstName }];
  const created = await api("/contacts", { method: "POST", body });
  if (created.ok && created.data && created.data.id) return created.data.id;
  // Contact déjà existant (Systeme.io répond en 4xx) : on le retrouve par son e-mail
  const existing = await findContactByEmail(email);
  if (existing && existing.id) return existing.id;
  throw new Error(`contact: HTTP ${created.status}`);
}

async function searchTag(name, maxPages) {
  let after = null;
  for (let page = 0; page < maxPages; page++) {
    const r = await api(`/tags?limit=100${after ? `&startingAfter=${after}` : ""}`);
    if (!r.ok) break;
    const items = itemsOf(r.data);
    const hit = items.find((t) => t.name === name);
    if (hit) return hit.id;
    if (!items.length || !(r.data && r.data.hasMore)) break;
    after = items[items.length - 1].id;
  }
  return null;
}

async function findOrCreateTag(name) {
  const found = await searchTag(name, 30);
  if (found) return found;
  const c = await api("/tags", { method: "POST", body: { name } });
  if (c.ok && c.data && c.data.id) return c.data.id;
  // Le tag existe déjà probablement (409/422 côté Systeme.io) mais la recherche ci-dessus ne l'a pas trouvé
  // (pagination, tri différent…) : on refait une recherche plus large avant d'abandonner.
  const retry = await searchTag(name, 100);
  if (retry) return retry;
  throw new Error(`tag ${name}: HTTP ${c.status}`);
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });
  if (!process.env.SYSTEME_API_KEY) return json(500, { ok: false, error: "config" });

  let p;
  try { p = await req.json(); } catch { return json(400, { ok: false, error: "json" }); }

  // Anti-spam : champ piège rempli, ou formulaire envoyé en moins de 1,5 s => on répond « ok » sans rien faire
  if (p.website || (typeof p.elapsed === "number" && p.elapsed < 1500)) return json(200, { ok: true });

  const email = String(p.email || "").trim().toLowerCase();
  const firstName = String(p.firstName || "").trim().slice(0, 60);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) return json(400, { ok: false, error: "email" });
  if (p.consent !== true) return json(400, { ok: false, error: "consent" });
  if (!PROFILES.includes(p.profile) || !PILLARS.includes(p.weakest)) return json(400, { ok: false, error: "data" });

  let contactId;
  try {
    contactId = await ensureContact(email, firstName);
  } catch (e) {
    console.error("quiz-lead", e && e.message);
    return json(502, { ok: false, error: "upstream" });
  }

  // Le contact est créé : c'est le plus important (le PDF se débloque côté site dès que ok:true).
  // On pose ensuite les tags un par un, sans laisser le souci d'un seul tag annuler toute la réponse.
  const tags = ["quiz-lead", `quiz-papa-${p.profile}`, `quiz-pilier-${p.weakest}`, `quiz-${p.profile}-${p.weakest}`];
  for (const name of tags) {
    try {
      const tagId = await findOrCreateTag(name);
      await api(`/contacts/${contactId}/tags`, { method: "POST", body: { tagId } });
    } catch (e) {
      console.error("quiz-lead tag", name, e && e.message);
    }
  }

  // Champ personnalisé url_diagnostic : permet à un seul e-mail de secours (déclenché sur quiz-lead)
  // de pointer vers le bon PDF pour chaque personne, sans créer un e-mail par combinaison.
  // Valeur SANS "https://" : l'éditeur de lien de Systeme.io ajoute déjà ce préfixe automatiquement.
  try {
    const pdfUrl = `papafiable.fr/documents/diagnostics/diagnostic-${p.profile}-${p.weakest}.pdf`;
    await api(`/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: { fields: [{ slug: "url_diagnostic", value: pdfUrl }] },
    });
  } catch (e) {
    console.error("quiz-lead field", e && e.message);
  }

  return json(200, { ok: true });
};
