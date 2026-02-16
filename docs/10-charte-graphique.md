# Charte Graphique — Innov'Events

## Concept créatif

L'identité visuelle d'Innov'Events s'inspire de l'esthétique **rétro-terminal**, en référence au Minitel français. Ce choix crée un contraste intéressant : une agence événementielle moderne avec un look décalé, sobre et professionnel. Ça donne une identité forte et immédiatement reconnaissable.

## Palette de couleurs

| Rôle | Couleur | Code hex | Utilisation |
|------|---------|----------|-------------|
| Fond principal | Gris clair | `#e6e6e6` | Background général de l'application |
| Fond panneaux | Gris moyen | `#d9d9d9` | Header, footer, zones secondaires |
| Fond écran | Gris très clair | `#efefef` | Zones de contenu principales (`.minitel-screen`) |
| Texte principal | Noir profond | `#111111` | Texte courant, titres, boutons |
| Texte secondaire | Gris foncé | `#333333` | Texte atténué (footer, mentions) |
| Hover / survol | Gris | `#cfcfcf` | État survol des liens |
| Ombre portée | Gris moyen | `#666666` / `#777777` | Box-shadow sur les boutons et écrans |

La palette est volontairement **monochrome** (nuances de gris + noir). Pas de couleur vive, pas de gradient complexe. Le contraste noir/gris clair assure une bonne lisibilité et respecte les normes d'accessibilité RGAA (ratio de contraste > 7:1 pour le texte principal).

### Couleurs fonctionnelles (dans les pages métier)

En complément de la palette de base, certaines couleurs utilitaires sont utilisées dans les interfaces métier (statuts, alertes) :

| Rôle | Couleur | Utilisation |
|------|---------|-------------|
| Succès / Validé | Vert Bootstrap | Statut "Accepté", "Terminé", badges actifs |
| Attention / En cours | Orange Bootstrap | Statut "En attente", alertes modérées |
| Erreur / Refusé | Rouge Bootstrap | Statut "Refusé", erreurs de formulaire |
| Info / Neutre | Bleu Bootstrap | Statut "Brouillon", liens informatifs |

Ces couleurs viennent de Bootstrap (utilisé pour la mise en page) et s'intègrent dans le thème Minitel via les classes utilitaires.

## Typographie

| Usage | Police | Stack complet |
|-------|--------|---------------|
| **Tout le site** | Monospace | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` |

Un seul choix typographique : la police **monospace système**. Chaque OS affiche sa propre monospace native (Menlo sur macOS, Consolas sur Windows, Liberation Mono sur Linux), ce qui garantit un rendu rapide sans téléchargement de fonts.

Ce choix est cohérent avec l'esthétique terminal. On ne charge aucune police externe (Google Fonts, etc.), ce qui améliore les performances et le respect de la vie privée.

### Styles typographiques

| Élément | Taille | Graisse | Casse |
|---------|--------|---------|-------|
| Marque "INNOV'EVENTS" | Base | Normal | MAJUSCULES + letter-spacing 0.06em |
| Titres de page | h2 | Bold | Normale |
| Texte courant | Base (16px) | Normal | Normale |
| Texte atténué | Small | Normal | Normale |
| Boutons CTA | Base | Normal | Normale |

## Composants visuels

### Boutons (`.minitel-cta`)

```
┌──────────────────┐
│  Texte du bouton │  ← fond #111, texte #e6e6e6
└──────────────────┘
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← ombre portée 2px décalée (#666)
```

Style "touche de clavier" :
- Bordure : 2px solid #111
- Fond : #111 (noir)
- Texte : #e6e6e6 (gris clair)
- Ombre portée : 2px 2px 0 #666 (effet relief)
- Border-radius : 0 (angles droits, pas d'arrondi)
- Au survol : légère translation (-1px, -1px) + ombre agrandie (effet "touche enfoncée")

### Liens de navigation (`.minitel-link`)

- Pas de soulignement (text-decoration: none)
- Couleur : #111
- Padding : 0.25rem 0.4rem
- Au survol : fond #cfcfcf + outline 2px solid #111
- État actif (page courante) : fond #111, texte #e6e6e6 (inversion)

### Cartes / Écrans (`.minitel-screen`)

```
┌──────────────────────────┐
│                          │  ← fond #efefef
│   Contenu de la carte    │  ← bordure 2px solid #111
│                          │
└──────────────────────────┘
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← ombre 6px 6px 0 #777
```

Les zones de contenu imitent un écran de terminal :
- Fond : #efefef
- Bordure : 2px solid #111
- Ombre portée : 6px 6px 0 #777 (effet "objet posé")
- Padding : 1rem

### Effet "écran CRT" (`.minitel-shell`)

Un léger gradient radial simule la luminosité centrale d'un ancien écran cathodique :
```css
background: radial-gradient(circle at 50% 10%, #f2f2f2 0%, #e6e6e6 60%);
```

## Accessibilité

Le design respecte les critères RGAA suivants :

- **Contraste texte** : ratio > 7:1 (#111 sur #e6e6e6 = ~13:1)
- **Focus visible** : outline 2px solid #111 sur tous les éléments interactifs
- **Lien d'évitement** : `.skip-link` masqué visuellement, visible au focus clavier
- **Pas de couleur seule** : les statuts utilisent du texte + un indicateur visuel (●), jamais la couleur seule
- **Police lisible** : monospace système, taille de base 16px minimum

## Application mobile

L'app mobile (React Native / Expo) reprend les mêmes principes :
- Palette monochrome gris/noir
- Police monospace système
- Composants épurés, pas d'animations inutiles
- Interface simplifiée pour usage terrain (employés)

## Logo

Pas de logo graphique : le nom "INNOV'EVENTS" est affiché en texte monospace majuscules avec un espacement de lettres élargi (`letter-spacing: 0.06em`). C'est un choix volontaire qui s'inscrit dans l'esthétique terminal du projet.
