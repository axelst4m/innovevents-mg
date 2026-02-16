import { useState, useEffect } from "react";

export default function Home() {
  const [stats, setStats] = useState(null);

  // On récupère quelques chiffres pour donner de la vie à la page
  useEffect(() => {
    fetch("/api/events?status=accepte&limit=100")
      .then(r => r.json())
      .then(json => {
        if (json.events) {
          setStats({ eventCount: json.events.length });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container py-4">

      {/* Hero section */}
      <section style={{ textAlign: "center", padding: "2rem 0 3rem" }}>
        <h1 style={{ fontSize: "2.4rem", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          INNOV'EVENTS
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#555", maxWidth: "600px", margin: "0 auto 1.5rem" }}>
          Agence événementielle haut de gamme. Nous concevons des séminaires
          et conférences sur-mesure qui marquent les esprits.
        </p>
        <a className="btn minitel-cta" href="/demande-devis" style={{ fontSize: "1rem", padding: "0.6rem 1.4rem" }}>
          Demander un devis
        </a>
      </section>

      {/* Présentation */}
      <section className="minitel-screen" style={{ marginBottom: "2rem" }}>
        <h2 style={{ borderBottom: "2px solid #111", paddingBottom: "0.4rem", marginBottom: "1rem" }}>
          Qui sommes nous ?
        </h2>
        <p>
          Fondée par Chloé et José, deux passionnés issus de grandes écoles de communication,
          Innov'Events s'est rapidement imposée sur le marché des événements professionnels.
          Notre équipe de 8 personnes met un point d'honneur à créer des expériences uniques
          et personnalisées pour chacun de nos clients.
        </p>
        <p style={{ marginTop: "0.8rem" }}>
          Notre philosophie repose sur trois piliers : la réactivité, la fiabilité
          et une personnalisation extrême de l'offre. Chaque événement est pensé
          comme une pièce unique, cousue main pour répondre à vos besoins.
        </p>
      </section>

      {/* Services */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="minitel-screen">
          <h3 style={{ marginBottom: "0.5rem" }}>Séminaires</h3>
          <p>
            Des séminaires d'entreprise qui combinent travail et cohésion d'équipe.
            De la demi-journée à la semaine complète, nous nous adaptons à vos objectifs.
          </p>
        </div>
        <div className="minitel-screen">
          <h3 style={{ marginBottom: "0.5rem" }}>Conférences</h3>
          <p>
            Organisation complète de vos conférences : logistique, technique,
            traiteur et communication. Vous vous concentrez sur le contenu, on gère le reste.
          </p>
        </div>
        <div className="minitel-screen">
          <h3 style={{ marginBottom: "0.5rem" }}>Soirées d'entreprise</h3>
          <p>
            Des soirées mémorables pour célébrer vos réussites, renforcer vos liens
            ou marquer un moment important de la vie de votre entreprise.
          </p>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="minitel-screen" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>En quelques chiffres</h2>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>5 ans</div>
            <div style={{ color: "#555" }}>d'expérience</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {stats?.eventCount || "50+"}
            </div>
            <div style={{ color: "#555" }}>événements réalisés</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>8</div>
            <div style={{ color: "#555" }}>collaborateurs</div>
          </div>
          <div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>100%</div>
            <div style={{ color: "#555" }}>sur-mesure</div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <h2 style={{ marginBottom: "0.8rem" }}>Un projet en tête ?</h2>
        <p style={{ color: "#555", marginBottom: "1rem" }}>
          Décrivez-nous votre événement et recevez une proposition personnalisée sous 48h.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a className="btn minitel-cta" href="/demande-devis">
            Demander un devis
          </a>
          <a className="btn minitel-cta" href="/contact" style={{ background: "transparent", color: "#111", border: "2px solid #111" }}>
            Nous contacter
          </a>
        </div>
      </section>
    </div>
  );
}
