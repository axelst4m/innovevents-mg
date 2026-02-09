# Wireframes

Maquettes simplifiées des principales pages de l'application. On a utilisé des schémas ASCII pendant la conception, avant de coder.

## Page d'accueil

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS                    [Événements] [Contact] [Connexion]
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Bienvenue chez Innov'Events                     │
│         Votre agence événementielle sur mesure               │
│                                                              │
│                  [Demander un devis]                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│    │ Service │    │ Service │    │ Service │               │
│    │    1    │    │    2    │    │    3    │               │
│    └─────────┘    └─────────┘    └─────────┘               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                     Nos réalisations                         │
│                                                              │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│    │   Event 1    │  │   Event 2    │  │   Event 3    │    │
│    │   [image]    │  │   [image]    │  │   [image]    │    │
│    │   Titre      │  │   Titre      │  │   Titre      │    │
│    └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                       Avis clients                           │
│    ★★★★★ "Super prestation..." - Jean D.                    │
│    ★★★★☆ "Très satisfait..." - Marie L.                     │
├──────────────────────────────────────────────────────────────┤
│  Footer - Contact - Mentions légales                         │
└──────────────────────────────────────────────────────────────┘
```

## Formulaire de demande de devis

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS                              [←] Retour accueil│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  Demande de devis                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Vos coordonnées                                        │ │
│  │                                                        │ │
│  │ Entreprise     [________________________]              │ │
│  │ Prénom         [____________] Nom [____________]       │ │
│  │ Email          [________________________]              │ │
│  │ Téléphone      [________________________]              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Votre événement                                        │ │
│  │                                                        │ │
│  │ Type           [▼ Séminaire / Conférence / ...]        │ │
│  │ Date           [__/__/____]                            │ │
│  │ Lieu           [________________________]              │ │
│  │ Participants   [____]                                  │ │
│  │                                                        │ │
│  │ Message        ┌────────────────────────────────────┐  │ │
│  │                │                                    │  │ │
│  │                │                                    │  │ │
│  │                └────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                      [Envoyer ma demande]                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Dashboard Admin

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS ADMIN                    Bonjour, Admin [▼]    │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │           Tableau de bord                       │
│  ─────────│                                                 │
│  Prospects │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  Clients   │  │   12    │ │    8    │ │    5    │          │
│  Devis     │  │Prospects│ │ Clients │ │  Devis  │          │
│  Events    │  │en cours │ │ actifs  │ │en attente│          │
│  Users     │  └─────────┘ └─────────┘ └─────────┘          │
│            │                                                 │
│            │  Dernières activités                            │
│            │  ─────────────────────                          │
│            │  • Nouveau prospect - Ma Boîte - il y a 2h     │
│            │  • Devis accepté - DEV-2026-0003 - hier        │
│            │  • Nouvel avis - ★★★★★ - il y a 3j            │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

## Liste des prospects (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS ADMIN                                          │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │           Prospects                             │
│  ─────────│                                                 │
│▶ Prospects │  Filtrer: [▼ Tous les statuts]                 │
│  Clients   │                                                 │
│  Devis     │  ┌─────────────────────────────────────────────┐│
│  Events    │  │ Entreprise  │ Contact    │ Date   │ Statut  ││
│  Users     │  ├─────────────┼────────────┼────────┼─────────┤│
│            │  │ Ma Boîte    │ Jean D.    │ 26/01  │ ● A contacter│
│            │  │             │            │        │ [Voir]  ││
│            │  ├─────────────┼────────────┼────────┼─────────┤│
│            │  │ Corp Inc    │ Marie L.   │ 25/01  │ ● Contacté│
│            │  │             │            │        │ [Voir]  ││
│            │  ├─────────────┼────────────┼────────┼─────────┤│
│            │  │ Startup     │ Paul M.    │ 24/01  │ ● Qualifié│
│            │  │             │            │        │ [Voir]  ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

## Modal détail prospect

```
┌────────────────────────────────────────────┐
│  Détail du prospect            [X]         │
├────────────────────────────────────────────┤
│                                            │
│  Ma Boîte SAS                              │
│  Jean Dupont                               │
│  jean@maboite.fr                           │
│  06 12 34 56 78                            │
│                                            │
│  ─────────────────────────────────         │
│                                            │
│  Type: Séminaire                           │
│  Date: 15/06/2026                          │
│  Lieu: Paris                               │
│  Participants: 50                          │
│                                            │
│  Message:                                  │
│  "Nous souhaitons organiser un séminaire   │
│   pour nos équipes commerciales..."        │
│                                            │
│  ─────────────────────────────────         │
│                                            │
│  Statut actuel: ● A contacter              │
│                                            │
│  [Contacté] [Qualifié] [Refusé]            │
│                                            │
├────────────────────────────────────────────┤
│ [Convertir en client]  [Compléter le devis]│
└────────────────────────────────────────────┘
```

## Page devis (édition admin)

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS ADMIN                                          │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │  Devis DEV-2026-0005            [Brouillon]    │
│  Prospects │                                                 │
│  Clients   │  Client: Ma Boîte - Jean Dupont                │
│▶ Devis     │  Validité: 25/02/2026                          │
│  Events    │                                                 │
│  Users     │  ┌─────────────────────────────────────────────┐│
│            │  │ Prestation          │ Qté │ PU HT  │ Total  ││
│            │  ├─────────────────────┼─────┼────────┼────────┤│
│            │  │ Location salle      │  1  │ 800 €  │ 800 €  ││
│            │  │ Traiteur (50 pers)  │  1  │ 1500 € │ 1500 € ││
│            │  │ Animation DJ        │  1  │ 600 €  │ 600 €  ││
│            │  ├─────────────────────┴─────┴────────┼────────┤│
│            │  │                        Total HT    │ 2900 € ││
│            │  │                        TVA 20%     │ 580 €  ││
│            │  │                        Total TTC   │ 3480 € ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
│            │  [+ Ajouter une ligne]                          │
│            │                                                 │
│            │  Message personnalisé:                          │
│            │  ┌─────────────────────────────────────────────┐│
│            │  │ Suite à notre échange téléphonique...       ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
│            │  [Enregistrer]  [Prévisualiser PDF]  [Envoyer] │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

## Espace client - Mes devis

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS                    Bonjour, Jean [Mon compte ▼]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                      Mes devis                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Référence     │ Date      │ Montant   │ Statut         │ │
│  ├───────────────┼───────────┼───────────┼────────────────┤ │
│  │ DEV-2026-0005 │ 26/01/26  │ 3 480 €   │ ● En attente   │ │
│  │               │           │           │ [Voir]         │ │
│  ├───────────────┼───────────┼───────────┼────────────────┤ │
│  │ DEV-2026-0002 │ 15/01/26  │ 5 200 €   │ ● Accepté      │ │
│  │               │           │           │ [Voir]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Espace client - Détail devis

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS                              [← Retour]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Devis DEV-2026-0005                                         │
│  Émis le 26/01/2026 - Valide jusqu'au 25/02/2026            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Prestation                      │ Qté │ Total TTC      │ │
│  ├─────────────────────────────────┼─────┼────────────────┤ │
│  │ Location salle séminaire        │  1  │ 960,00 €       │ │
│  │ Traiteur - Formule business     │ 50  │ 1 800,00 €     │ │
│  │ Animation DJ                    │  1  │ 720,00 €       │ │
│  ├─────────────────────────────────┴─────┼────────────────┤ │
│  │                           Total TTC   │ 3 480,00 €     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Message:                                                    │
│  "Suite à notre échange, voici notre proposition..."         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  [Télécharger PDF]                                   │   │
│  │                                                      │   │
│  │  [Accepter ce devis]  [Demander une modification]    │   │
│  │                                                      │   │
│  │  [Refuser]                                           │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Gestion des utilisateurs (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  INNOV'EVENTS ADMIN                                          │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Dashboard │           Utilisateurs                          │
│  Prospects │                                                 │
│  Clients   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  Devis     │  │  8  │ │  2  │ │  2  │ │  4  │ │  7  │      │
│  Events    │  │Total│ │Admin│ │Empl.│ │Client│ │Actif│      │
│▶ Users     │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│            │                                                 │
│            │  Filtres: [▼ Rôle] [▼ Statut]                  │
│            │                                                 │
│            │  [+ Nouvel utilisateur]                         │
│            │                                                 │
│            │  ┌─────────────────────────────────────────────┐│
│            │  │ Nom         │ Email       │ Rôle  │ Statut ││
│            │  ├─────────────┼─────────────┼───────┼────────┤│
│            │  │ Admin Test  │ admin@ino.fr│ Admin │ ● Actif││
│            │  │             │             │       │ [···]  ││
│            │  ├─────────────┼─────────────┼───────┼────────┤│
│            │  │ Jean Dupont │ jean@test.fr│ Client│ ● Actif││
│            │  │             │             │       │ [···]  ││
│            │  ├─────────────┼─────────────┼───────┼────────┤│
│            │  │ Marie L.    │ marie@ex.fr │ Client│ ○ Inactif│
│            │  │             │             │       │ [···]  ││
│            │  └─────────────────────────────────────────────┘│
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘

[···] = Menu actions : Modifier / Désactiver / Reset MDP
```

## Notes

Ces wireframes ont été faits au début du projet pour se mettre d'accord sur la structure des pages. Le rendu final peut différer légèrement mais l'esprit général est respecté.

On n'a pas utilisé d'outil type Figma, les schémas ASCII suffisaient pour notre besoin.
