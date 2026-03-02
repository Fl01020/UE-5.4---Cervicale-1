# Module e-learning — Évaluation clinique du rachis cervical
**Cas clinique : Monsieur F, 53 ans, plombier**

Module interactif de simulation clinique pour la formation en kinésithérapie. L'étudiant mène une anamnèse libre, analyse les données, conduit un examen clinique et raisonne jusqu'au diagnostic et à la prise en charge.

---

## Sommaire

1. [Structure des fichiers](#structure-des-fichiers)
2. [Lancer le module](#lancer-le-module)
3. [Architecture technique](#architecture-technique)
4. [Ajouter les assets multimédias](#ajouter-les-assets-multimédias)
5. [Les 15 types d'étapes (scenarios.js)](#les-15-types-détapes)
6. [Parcours pédagogique](#parcours-pédagogique)
7. [Personnaliser le contenu](#personnaliser-le-contenu)
8. [Intégration Moodle / SCORM](#intégration-moodle--scorm)
9. [Navigateurs compatibles](#navigateurs-compatibles)

---

## Structure des fichiers

```
cervical/
│
├── index.html              ← Point d'entrée unique
│
├── css/
│   └── style.css           ← Styles complets (1 538 lignes)
│
├── js/
│   ├── scenarios.js        ← Contenu clinique — 39 étapes, 15 types
│   └── app.js              ← Moteur de rendu et navigation (46 fonctions)
│
├── assets/
│   ├── images/             ← Schémas, photos posturales, tests
│   │   ├── posture_face.png
│   │   ├── posture_dos.png
│   │   ├── posture_profil.png
│   │   ├── test_spurling.png
│   │   ├── test_distraction.png
│   │   ├── test_arm_squeeze.png
│   │   ├── test_bakody.png
│   │   ├── test_flexion_rotation.png
│   │   └── test_diff_cervico_thoracique.png
│   │
│   ├── videos/             ← Démonstrations de mouvements cervicaux
│   │   ├── flexion.mp4
│   │   ├── extension.mp4
│   │   ├── inflexion_droite.mp4
│   │   ├── inflexion_gauche.mp4
│   │   ├── rotation_droite.mp4
│   │   ├── rotation_gauche.mp4
│   │   ├── protraction.mp4
│   │   └── retraction.mp4
│   │
│   └── audio/              ← (optionnel) Musique d'ambiance
│       └── ambient_clinic.mp3
│
└── README.md               ← Ce fichier
```

> **Note :** Le module fonctionne sans les assets (les médias manquants affichent des placeholders).  
> Le contenu clinique est entièrement fonctionnel dès le premier lancement.

---

## Lancer le module

### En local (développement)

Le module nécessite un serveur HTTP local — les navigateurs bloquent le chargement de fichiers JS locaux par sécurité.

**Option 1 — Python (intégré sur macOS/Linux)**
```bash
cd chemin/vers/cervical/
python3 -m http.server 8080
# Ouvrir : http://localhost:8080
```

**Option 2 — Node.js**
```bash
npx serve .
# ou : npx http-server -p 8080
```

**Option 3 — VS Code**
Installer l'extension **Live Server**, clic droit sur `index.html` → *Open with Live Server*.

### En production (hébergement web)

Copier le dossier `cervical/` sur n'importe quel hébergeur web statique (Apache, Nginx, GitHub Pages, Netlify…). Aucune dépendance serveur, aucune base de données.

---

## Architecture technique

### Séparation des responsabilités

| Fichier | Rôle |
|---|---|
| `scenarios.js` | **Contenu clinique pur.** Définit les 39 étapes avec leurs données, keywords, pools de mouvements, feedbacks. Aucune logique de rendu. |
| `app.js` | **Moteur.** Lit `SCENARIOS`, gère l'état, injecte le DOM, orchestre la navigation. Ne contient aucune donnée clinique. |
| `style.css` | **Présentation.** Zéro logique fonctionnelle — classes uniquement. |
| `index.html` | **Squelette statique.** Structure HTML permanente ; tout le contenu est injecté dynamiquement. |

### Flux de données

```
scenarios.js   →   app.js render()   →   #content + #choices
    ↓                    ↓
 Étapes               État (state{})
 Topics               Dossier patient
 Pools                PDF final
```

### État global (`state`)

L'objet `state` accumule les données cliniques au fil du parcours :

```javascript
state = {
  rythme:                  'mixte',
  type_douleur:            'nociceptif',
  feu:                     'vert',
  observation:             'Position antalgique…',
  flexion_active:          'F-ND',
  extension_active:        'NF-D',
  spurling:                'négatif',
  ctdt:                    'origine cervicale',
  niveau_vertebral:        'C6-C7',
  preference_directionnelle: 'rétraction + inflexion droite',
  pronostic:               'bon',
  …
}
```

---

## Ajouter les assets multimédias

### Vidéos de mouvements cervicaux

Les vidéos sont affichées dans les phases **Amplitudes actives** et **Amplitudes passives** pendant l'examen libre.

**Spécifications recommandées :**
- Format : MP4 (H.264)
- Résolution : 1280×720 minimum
- Durée : 5–15 secondes par mouvement
- Vue : profil ou ¾ face, fond neutre, landmarks anatomiques visibles

**Mouvements à filmer (8 vidéos) :**

| Fichier | Mouvement | Résultat attendu M. F |
|---|---|---|
| `flexion.mp4` | Flexion cervicale | F-ND (libre, indolore) |
| `extension.mp4` | Extension cervicale | NF-D (limitée, douloureuse cervicales basses D + bras) |
| `inflexion_droite.mp4` | Inflexion latérale droite | NF-D (limitée, douloureuse cervicales basses D + interscapulaire) |
| `inflexion_gauche.mp4` | Inflexion latérale gauche | F-D (complète, douloureuse cervicales D) |
| `rotation_droite.mp4` | Rotation droite | NF-D (très limitée, irradiation bras D) |
| `rotation_gauche.mp4` | Rotation gauche | F-ND (libre, indolore) |
| `protraction.mp4` | Protraction cervicale | F-ND (libre, indolore) |
| `retraction.mp4` | Rétraction cervicale | F-ND (libre, indolore) |

### Photos posturales

Trois photos utilisées dans la phase **Observation** :

| Fichier | Contenu |
|---|---|
| `posture_face.png` | Patient de face, debout, tête en légère rotation gauche |
| `posture_dos.png` | Patient de dos, attitude en antéflexion visible |
| `posture_profil.png` | Patient de profil, position antalgique |

### Photos des tests orthopédiques

Utilisées comme illustrations statiques dans la phase **Tests** :

| Fichier | Test |
|---|---|
| `test_spurling.png` | Test de Spurling (compression + inclinaison homo-latérale) |
| `test_distraction.png` | Test de distraction cervicale |
| `test_arm_squeeze.png` | Arm Squeeze Test |
| `test_bakody.png` | Signe de Bakody |
| `test_flexion_rotation.png` | Test de flexion-rotation (C1-C2) |
| `test_diff_cervico_thoracique.png` | Test de différentiation cervico-thoracique |

> Les images manquantes affichent un placeholder avec l'icône 🖼 et le nom du test — le module reste entièrement fonctionnel sans elles.

---

## Les 15 types d'étapes

Chaque étape dans `scenarios.js` possède un champ `type` qui détermine comment `app.js` la rend.

### 1. `intro`
Écran de titre. Blocs `content[]` rendus, puis bouton Continuer.

### 2. `choix-initial`
Deux boutons au choix (Anamnèse ou Examen direct). Navigation vers des branches différentes.

### 3. `interrogatoire`
Anamnèse libre par saisie texte. Moteur de matching par keywords. Peuple dynamiquement le dossier patient. 14 topics + question_large.

### 4. `bilan-anamnese`
Grille de bilan post-anamnèse. Score topics couverts / total. Icônes ✓ / ✗ / ! selon importance et couverture.

### 5. `vignette-recap`
Fiche récap clinique complète en 4 sections. Section IRM mise en évidence (highlight doré). Déclenche `switchDossierToExam()`.

### 6. `choix-argumente`
Checkboxes d'arguments cliniques + boutons de choix. Arguments sauvegardés dans `argumentsCoches{}` pour le PDF. Utilisé pour Rythme, Type, Feu.

### 7. `bilan-decisionnel`
Synthèse des 3 décisions (rythme / type / feu) avec code couleur vert/rouge.

### 8. `step`
Étape standard avec blocs `content[]` et choix ou bouton Continuer.

### 9. `error`
Feedback d'erreur. Le choix correct n'incrémente pas le compteur d'erreurs.

### 10. `choix-libre`
Saisie libre avec keyword matching. Correct → navigation directe. Incorrect → feedback non bloquant + auto-navigation après 2s.

### 11. `observation-libre`
Phase observation en deux temps :
- Description de la posture (détection mot-clé "antalgique")
- Demande du mouvement opposé (confirmation de la position antalgique)
Avertissement non bloquant si le mouvement opposé n'est pas demandé.

### 12. `examen-libre`
Phase d'examen libre multimodale. Saisie unique ou multiple (plusieurs mouvements dans une phrase). Pour chaque mouvement reconnu :
- Vidéo ou image affichée dans le chat
- Dialogues patient séquencés
- Résultat avec tag coloré (F-ND / F-D / NF-D)
- Mise à jour de l'état et du dossier
Vérification des oublis à la sortie (non bloquant).

### 13. `cerveau-branche`
Grille multi-sélection par mouvement. 5 options de dysfonction + 2 choix de conduite. Évaluation par `evaluerCerveau()` avec 6 règles pédagogiques. Feedback par carte.

### 14. `conclusion`
Écran de fin avec récap et bouton PDF.

### 15. `recap`
Récapitulatif complet avec tableaux et bouton PDF.

---

## Parcours pédagogique

```
Start (intro)
  └─→ ChoixInitial
         ├─→ [chemin A] Anamnese (interrogatoire libre)
         │         └─→ BilanAnamnese
         │                   └─→ FicheRecapAnamnese (vignette-recap)
         │                             └─→ Localisation
         └─→ [chemin B] FeedbackExamenDirect (error)
                   └─→ FicheRecapAnamnese (vignette-recap)
                             └─→ Localisation

Localisation (step + choix)
  └─→ RythmeArguments (choix-argumente)
        └─→ TypeDouleurArguments (choix-argumente)
              └─→ FeuArguments (choix-argumente)
                    └─→ BilanDecisionnel (bilan-decisionnel)
                          └─→ ExamenClinique_Entree (choix-libre)
                                └─→ Observation (observation-libre)
                                      └─→ AmplitudesActives (examen-libre)
                                            └─→ TestsExamen (examen-libre)
                                                  └─→ RaisonnementPassives (step)
                                                        └─→ AmplitudesPassives (examen-libre)
                                                              └─→ OnBrancleLeCerveau (cerveau-branche)
                                                                    └─→ Transition_Palpation (choix-libre)
                                                                          └─→ PalpationDynamique (step)
                                                                                └─→ PalpationStatique (step)
                                                                                      └─→ MouvementsRepetes (step)
                                                                                            └─→ PriseEnCharge (step)
                                                                                                  └─→ Conclusion
                                                                                                        └─→ [PDF]
                                                                                                        └─→ RecapitulatifFinal
```

---

## Personnaliser le contenu

### Modifier une réponse patient

Dans `scenarios.js`, chaque topic de l'anamnèse possède un champ `reponse` :
```javascript
eva: {
  keywords: ['douleur', 'eva', 'intensite', 'echelle', 'note', 'combien', '/10'],
  reponse: 'Je dirais... 5 sur 10 en ce moment.',
  field: { key: 'eva', label: 'EVA', value: '5/10', importance: 'required' }
}
```

### Ajouter un mouvement au pool d'examen

Dans le pool de l'étape `AmplitudesActives` :
```javascript
mon_mouvement: {
  keywords: ['mon mouvement', 'terme_alternatif'],
  label: 'Mon Mouvement',
  stateKey: 'mon_mouvement_active',
  resultat: 'F-ND',
  interpretation: 'Mouvement libre et indolore',
  video: { src: 'assets/videos/mon_mouvement.mp4', placeholder: 'Vidéo mon mouvement' },
  dialogues: ['(Le patient réalise le mouvement sans difficulté)'],
  dossierValue: 'F-ND'
}
```

### Changer les feedbacks de "On branche le cerveau"

Les 6 règles sont dans `SCENARIOS['OnBrancleLeCerveau'].regles.feedbacks` :
- `articulaire_et_tissulaire` — réponse correcte
- `controle_moteur.texteArret` — correct + s'arrêter
- `controle_moteur.texteContinuer` — incomplet
- `musculaire_seul` — imprécis
- `articulaire_seul` / `tissulaire_seul` — incomplet
- `pas_de_dysfonction` — erreur

---

## Intégration Moodle / SCORM

### Option 1 — Lien direct (recommandée pour commencer)

1. Héberger le dossier `cervical/` sur un serveur web (ou GitHub Pages)
2. Dans Moodle : **Ajouter une ressource → URL**
3. Coller l'URL vers `index.html`
4. Cocher *Ouvrir dans une nouvelle fenêtre* ou utiliser une iframe

### Option 2 — Package SCORM 1.2

Pour le suivi de progression (score, complétion) dans le LMS :

1. Installer [ispring Suite](https://www.ispringsolutions.com/) ou utiliser [SCORM Cloud](https://scorm.com/)  
   ou packager manuellement avec [TinCan / xAPI](https://xapi.com/)
2. Ajouter l'appel SCORM dans `app.js` au moment de la conclusion :
   ```javascript
   // Dans la fonction navigate() quand nextId === 'Conclusion'
   if (typeof pipwerks !== 'undefined') {
     pipwerks.SCORM.set('cmi.core.score.raw', pct);
     pipwerks.SCORM.set('cmi.core.lesson_status', pct >= 60 ? 'passed' : 'failed');
     pipwerks.SCORM.save();
   }
   ```
3. Zipper le dossier `cervical/` → importer dans Moodle via **Activité → SCORM**

### Option 3 — iframe dans une page Moodle

Dans un label ou une page Moodle (HTML brut activé) :
```html
<iframe
  src="https://votre-serveur.com/cervical/index.html"
  width="100%"
  height="700px"
  frameborder="0"
  allowfullscreen>
</iframe>
```

---

## Navigateurs compatibles

| Navigateur | Version minimale | Notes |
|---|---|---|
| Chrome / Chromium | 88+ | ✅ Recommandé |
| Firefox | 85+ | ✅ Complet |
| Safari | 14+ | ✅ Complet |
| Edge | 88+ | ✅ Complet |
| Safari iOS | 14+ | ✅ Fonctionne |
| Chrome Android | 88+ | ✅ Fonctionne |

> Le sélecteur CSS `:has()` (utilisé pour les checkboxes dynamiques) nécessite Chrome 105+, Safari 15.4+, Firefox 121+.  
> Sur navigateurs plus anciens, les styles des cases cochées seront absents mais les fonctionnalités restent intactes.

---

## Développement futur

- [ ] Intégration SCORM 1.2 native
- [ ] Module rachis lombaire (même architecture)
- [ ] Mode formateur : affichage de la session étudiante
- [ ] Variantes de cas cliniques (patient différent, même algorithme)
- [ ] Synthèse vocale pour les réponses patient (Web Speech API)

---

*Module développé pour la formation en chiropraxie — Évaluation clinique du rachis cervical.*