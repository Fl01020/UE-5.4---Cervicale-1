/* ============================================================
   SCENARIOS — Rachis Cervical — Monsieur F, 53 ans
   ============================================================
   TYPES UTILISÉS :
   'intro'            — écran de départ
   'choix-initial'    — premier choix anamnèse ou examen clinique
   'interrogatoire'   — saisie libre anamnèse
   'bilan-anamnese'   — grille de bilan anamnèse
   'vignette-recap'   — fiche récap clinique + IRM
   'choix-argumente'  — case à cocher + choix (rythme / type / feu)
   'step'             — étape standard avec contenus + boutons
   'error'            — feedback erreur → redirection
   'choix-libre'      — saisie libre pour choisir l'étape suivante
   'observation-libre'— saisie libre phase observation
   'examen-libre'     — saisie libre multi-actions (amplitudes, tests)
   'cerveau-branche'  — multi-sélect par amplitude
   'conclusion'       — écran de fin
   'recap'            — récapitulatif complet
   ============================================================ */

const SCENARIOS = {

  // ============================================================
  // DÉPART — vignette patient uniquement
  // ============================================================

  'Start': {
    type: 'intro',
    scene: 'cabinet',
    content: [
      { type: 'title',    text: 'Évaluation clinique du rachis cervical' },
      { type: 'subtitle', text: 'Cas clinique — Monsieur F, 53 ans, Plombier' },
      { type: 'narration', text: 'Un homme entre dans votre cabinet. Il semble fatigué, la main posée sur sa nuque.' },
      { type: 'dialogue',  speaker: 'Monsieur F', text: 'Bonjour… J\'ai des douleurs cervicales qui deviennent vraiment gênantes.' }
    ],
    next: 'ChoixInitial'
  },

  // ============================================================
  // CHOIX INITIAL — anamnèse ou examen clinique direct
  // ============================================================

  'ChoixInitial': {
    type: 'choix-initial',
    scene: 'cabinet',
    content: [
      { type: 'narration', text: 'Comment souhaitez-vous commencer votre évaluation ?' }
    ],
    question: 'Par quoi commencez-vous ?',
    choices: [
      // FANTÔME : next pointe sur FicheRecapAnamnese — l'interrogatoire dynamique
      // sera activé dans une version ultérieure (remplacer par 'Anamnese')
      { text: '📋 Réaliser l\'anamnèse',       next: 'FicheRecapAnamnese',    correct: true },
      { text: '🔬 Passer à l\'examen clinique', next: 'FeedbackExamenDirect' }
    ]
  },

  'FeedbackExamenDirect': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'L\'anamnèse est la première étape indispensable. Elle permet d\'identifier le rythme, le type douloureux, les drapeaux rouges et d\'orienter l\'examen clinique.' },
      { type: 'narration', text: 'Voici les informations que l\'anamnèse aurait permis de recueillir.' }
    ],
    next: 'FicheRecapAnamnese'
  },

  // ============================================================
  // 1. ANAMNÈSE — INTERROGATOIRE LIBRE
  // ============================================================

  'Anamnese': {
    type: 'interrogatoire',
    etape: 1,
    label: 'Anamnèse',
    scene: 'cabinet',
    intro: 'Posez vos questions à Monsieur F. Tapez votre question et appuyez sur Envoyer. Vous pouvez terminer l\'anamnèse quand vous le souhaitez.',

    topics: {

      // ——— Question d'ouverture large ———
      question_large: {
        keywords: [
          'amene', 'amenez', 'racontez', 'expliquez', 'que puis-je', 'en quoi puis',
          'comment puis-je', 'pouvez-vous me parler', 'parlez-moi',
          'bonjour', 'bonsoir', 'comment allez', 'comment vous sentez', 'comment ca va',
          'motif', 'consultation', 'plainte principale', 'vous voir', 'vous amene',
          'que se passe', 'quel est votre probleme', 'votre probleme'
        ],
        multiFields: [
          { key: 'localisation_douleur', label: 'Localisation',          value: 'Cervicales basses → avant-bras D → pouce', importance: 'required' },
          { key: 'duree',               label: 'Durée / Évolution',      value: '7 ans (↑ 2 mois, fourmillements 2 sem.)', importance: 'required' },
          { key: 'contexte_pro',        label: 'Contexte professionnel', value: 'Plombier 25 ans — charge physique élevée',  importance: 'important' }
        ],
        reponse: "J'ai des douleurs dans la nuque et les cervicales basses depuis 7 ans… mais là depuis 2 mois c'est vraiment aggravé. Et depuis 2 semaines j'ai des fourmillements dans l'avant-bras droit jusqu'au pouce, c'est permanent. C'est vraiment gênant au travail — je suis plombier depuis 25 ans, et travailler les bras en l'air c'est devenu très difficile."
      },

      // ——— Localisation ———
      localisation: {
        keywords: [
          'localis', 'endroit', 'nuque', 'cervical', 'cervicale',
          'irradie', 'irradiation', 'descend', 'diffuse',
          'ou avez-vous mal', 'ou est la douleur', 'ou se situe', 'siege de la douleur',
          'membre superieur', 'avant-bras', 'pouce', 'brachial',
          'dans le bras', 'dans le cou'
        ],
        reponse: "C'est surtout dans les cervicales basses, et ça descend dans l'avant-bras droit jusqu'au pouce.",
        field: { key: 'localisation_douleur', label: 'Localisation', value: 'Cervicales basses → avant-bras D → pouce', importance: 'required' }
      },

      // ——— Durée / évolution ———
      duree: {
        keywords: [
          'duree', 'depuis quand', 'depuis combien', 'ca dure', 'combien de temps',
          'anciennete', 'apparu', 'survenu',
          'quand ca a commence', 'quand cela a debute',
          'debute', 'recent', 'ancien', 'evolution de',
          'aggravation', 'histoire de', 'aggrave depuis', 'depuis le debut'
        ],
        reponse: "J'ai des douleurs cervicales récurrentes depuis 7 ans, mais depuis 2 mois c'est vraiment pire. Et depuis 2 semaines j'ai des fourmillements permanents dans le bras.",
        field: { key: 'duree', label: 'Durée / Évolution', value: '7 ans (↑ 2 mois, fourmillements 2 sem.)', importance: 'required' }
      },

      // ——— Sommeil / réveils nocturnes ———
      nuit: {
        keywords: [
          'sommeil', 'dormir', 'dormez', 'dort', 'dors', 'dormi',
          'nuit', 'nocturne', 'insomnie',
          '4h', 'reveille', 'reveils nocturnes', 'mal dormir',
          'vous reveille', 'la nuit', 'pendant la nuit', 'en dormant',
          'position couchee', 'allonge', 'quand vous dormez'
        ],
        reponse: "Oui, ça m'arrive de me réveiller vers 4h du matin après les grosses journées de boulot. Le sommeil est vraiment perturbé depuis 2 semaines.",
        field: { key: 'reveils_nuit', label: 'Réveils nocturnes / Sommeil', value: 'Perturbé — réveils vers 4h après effort', importance: 'required' }
      },

      // ——— Dérouillage matinal ———
      derouillage: {
        keywords: [
          'derouillage', 'raideur', 'raide', 'rigide', 'ankylose',
          'matin', 'matinal', 'lever', 'reveil',
          'bloque le matin', '45 min', 'raideur matin', 'deverrouillage',
          'en se levant', 'au lever'
        ],
        reponse: "Oui, j'ai une raideur le matin d'environ 45 minutes depuis 2 semaines. Après ça se déroule un peu, mais c'est pénible pour commencer le travail.",
        field: { key: 'derouillage', label: 'Dérouillage matinal', value: '45 min (depuis 2 sem.)', importance: 'required' }
      },

      // ——— Intensité EVA ———
      eva: {
        keywords: [
          'eva', 'intensite', 'sur 10', '/10', 'chiffre',
          'note', 'cotez', 'evaluez', 'score',
          'combien souffrez', 'combien de douleur', 'a combien',
          'niveau de douleur', 'douleur forte', 'tres fort', 'severe', 'violent',
          'quelle intensite', 'echelle de douleur'
        ],
        reponse: "Je dirais 5 sur 10. C'est supportable mais vraiment gênant au travail, surtout en fin de journée.",
        field: { key: 'eva', label: 'Intensité (EVA)', value: '5 / 10', importance: 'required' }
      },

      // ——— DN4 / paresthésies ———
      dn4: {
        keywords: [
          'dn4', 'fourmillement', 'fourmille', 'brulure', 'brule',
          'electrique', 'picotement', 'engourdissement', 'engourdi',
          'dysesthesie', 'paresthesie', 'type de douleur',
          'qualite de', 'qualite douleur', 'caractere de la douleur',
          'decharge', 'choc electrique', 'aiguilles', 'sensation bizarre',
          'sensibilite', 'sensitif', 'comment vous decririez'
        ],
        reponse: "Il y a surtout des fourmillements dans l'avant-bras jusqu'au pouce, permanents depuis 2 semaines. Pas vraiment de brûlures. Un médecin m'a dit que c'est un DN4 à 2 sur 10.",
        field: { key: 'dn4_paresthesies', label: 'DN4 / Paresthésies', value: 'Fourmillements permanents — DN4 2/10', importance: 'required' }
      },

      // ——— Mécanisme de survenue ———
      mecanisme_survenue: {
        keywords: [
          'arrive', 'survenu', 'comment ca a commence', 'comment cela a commence',
          'cause', 'origine', 'pourquoi cette douleur', 'suite a',
          'brutal', 'progressif', 'progressivement',
          'geste declenchant', 'circonstance', 'comment est apparu',
          'comment vous avez eu', 'depuis quoi',
          'a quoi attribuez', 'raison de la douleur'
        ],
        reponse: "C'est progressif, pas d'accident particulier. Ça vient avec les années de plomberie — les positions en extension prolongée, les espaces confinés. Depuis 2 mois ça s'est vraiment aggravé sans raison précise, peut-être une grosse semaine de chantier.",
        field: { key: 'mecanisme_survenue', label: 'Mécanisme de survenue', value: 'Progressif — surcharge professionnelle, extension prolongée', importance: 'important' }
      },

      // ——— Facteurs aggravants / soulageants ———
      facteurs: {
        keywords: [
          'aggrave', 'soulage', 'pire quand', 'mieux quand',
          'ce qui aggrave', 'ce qui soulage', 'empire',
          'ameliore', 'facteur aggravant', 'facteur soulageant',
          'mouvement douloureux', 'geste douloureux',
          'position douloureuse', 'posture douloureuse',
          'repos aide', 'effort aggrave', 'quand cest pire', 'quand cest mieux',
          'declenche', 'provoque'
        ],
        reponse: "Ça empire en fin de journée et dans certaines positions — surtout quand je lève la tête en arrière. Le repos soulage un peu, mais maintenant c'est permanent même au repos.",
        field: { key: 'facteurs', label: 'Facteurs aggravants / soulageants', value: 'Extension du cou, fin de journée — Repos partiel', importance: 'important' }
      },

      // ——— Antécédents ———
      antecedents: {
        keywords: [
          'antecedent', 'deja eu', 'deja soigne', 'deja traite',
          'operation', 'chirurgie', 'accident', 'traumatisme', 'chute',
          'blessure', 'episode similaire', 'episode precedent',
          'arret de travail', 'hospitalisation', 'premiere fois',
          'consulte avant', 'passe medical', 'histoire medicale'
        ],
        reponse: "J'ai déjà eu des épisodes de cervicalgies avec des arrêts de travail, mais jamais d'opération ni d'hospitalisation.",
        field: { key: 'antecedents', label: 'Antécédents', value: 'Épisodes cervicalgies récurrents + arrêts travail', importance: 'important' }
      },

      // ——— Contexte professionnel ———
      travail: {
        keywords: [
          'travail', 'boulot', 'plombier', 'profession', 'metier',
          'emploi', 'activite professionnelle', 'charges lourdes',
          'bras en l\'air', 'position de travail', 'gestes repetitifs',
          'contrainte physique', 'espace confine', 'poste de travail',
          'ergonomie', 'manutention', 'que faites-vous', 'que faites vous'
        ],
        reponse: "Je suis plombier depuis 25 ans. Je travaille souvent les bras en l'air dans des espaces pas commodes — sous les éviers, dans les combles. C'est physiquement très demandant.",
        field: { key: 'contexte_pro', label: 'Contexte professionnel', value: 'Plombier 25 ans — bras en l\'air, charge physique élevée', importance: 'important' }
      },

      // ——— Signes généraux ———
      signes_generaux: {
        keywords: [
          'fievre', 'temperature', 'poids', 'amaigrissement', 'maigri',
          'etat general', 'AEG', 'sueur nocturne',
          'transpiration nocturne', 'fatigue generale', 'asthenie',
          'alteration generale', 'perdre du poids', 'signe general',
          'signe systemique'
        ],
        reponse: "Non, pas de fièvre, pas de perte de poids. Je me sens juste fatigué à cause des douleurs et du manque de sommeil, mais rien d'autre d'inquiétant.",
        field: { key: 'signes_generaux', label: 'Signes généraux', value: 'Aucun signe systémique (fièvre, amaigrissement)', importance: 'required' }
      },

      // ——— Déficit moteur ———
      force: {
        keywords: [
          'force', 'faiblesse musculaire', 'deficit moteur', 'paralysie',
          'prehension', 'serrer la main', 'tenir un objet',
          'bras faible', 'main faible', 'perte de force', 'motricite',
          'maladresse', 'echapper', 'lacher'
        ],
        reponse: "Non, je n'ai pas l'impression d'avoir perdu de la force. Je peux encore porter mes outils normalement.",
        field: { key: 'deficit_moteur', label: 'Déficit moteur', value: 'Absent — force conservée', importance: 'required' }
      },

      // ——— Traitements ———
      traitement: {
        keywords: [
          'traitement', 'medicament', 'antalgique', 'anti-douleur',
          'ordonnance', 'ibuprofene', 'paracetamol', 'AINS', 'doliprane',
          'infiltration', 'chiro', 'chiropracteur', 'collier',
          'pris quelque chose', 'automedication', 'pharmacie',
          'avez-vous pris', 'avez vous pris'
        ],
        reponse: "J'ai pris du paracétamol de temps en temps, ça aide un peu. Mon médecin m'a aussi prescrit un collier cervical, mais je le supporte vraiment mal.",
        field: { key: 'traitements', label: 'Traitements en cours', value: 'Paracétamol ± collier cervical (mal toléré)', importance: 'bonus' }
      }
    },

    offTopic: [
      "Je ne vois vraiment pas le rapport avec mes cervicales… Vous avez une approche… originale !",
      "Euh… vous êtes sûr que c'est utile pour mon diagnostic ? Ma femme aussi me pose des questions bizarres.",
      "Je suis plombier, pas philosophe — j'ai pas la réponse à ça, désolé !",
      "C'est une drôle de question pour un chiropracteur… Mais bon, si vous y tenez…",
      "Là vous me surprenez. Je viens pour mon cou, pas pour une séance d'introspection !"
    ],

    doublon: "Je ne sais pas quoi vous dire de plus par rapport à ma réponse précédente sur ce sujet.",
    requiredBeforeEnd: [],
    next: 'BilanAnamnese'
  },

  // ============================================================
  // 1B. BILAN ANAMNÈSE
  // ============================================================

  'BilanAnamnese': {
    type: 'bilan-anamnese',
    scene: 'cabinet',
    next: 'FicheRecapAnamnese'
  },

  // ============================================================
  // 1C. FICHE RÉCAP CLINIQUE + IRM
  // Affichée après anamnèse (ou après feedback examen direct)
  // ============================================================

  'FicheRecapAnamnese': {
    type: 'vignette-recap',
    scene: 'cabinet',
    title: 'Synthèse clinique — Monsieur F',
    subtitle: '53 ans · Plombier · Données disponibles avant examen',
    sections: [
      {
        titre: 'Motif de consultation',
        items: [
          'Cervicalgies basses récurrentes depuis 7 ans',
          'Aggravation progressive depuis 2 mois',
          'Fourmillements permanents avant-bras droit jusqu\'au pouce depuis 2 semaines'
        ]
      },
      {
        titre: 'Paramètres douloureux',
        items: [
          'EVA : 5 / 10',
          'DN4 : 2 / 10 (seuil neuropathique à 4 / 10)',
          'Réveils nocturnes vers 4h du matin',
          'Dérouillage matinal : 45 min (depuis 2 semaines)',
          'Douleur permanente au repos depuis 2 semaines'
        ]
      },
      {
        titre: 'Contexte',
        items: [
          'Plombier depuis 25 ans — extension cervicale prolongée, espaces confinés',
          'Antécédents : épisodes cervicalgies avec arrêts de travail',
          'Pas de traumatisme récent, pas de chute',
          'Pas de fièvre, pas d\'amaigrissement',
          'Force conservée, pas de déficit moteur'
        ]
      },
      {
        titre: 'Imagerie disponible',
        items: [
          '🔬 IRM rachis cervical — réalisée il y a 10 jours',
          'Résultat : discopathie C5-C6 sans conflit disco-radiculaire'
        ],
        highlight: true
      }
    ],
    next: 'Localisation'
  },

  // ============================================================
  // 2. LOCALISATION
  // ============================================================

  'Localisation': {
    type: 'step',
    etape: 2,
    label: 'Localisation',
    scene: 'cabinet',
    content: [
      { type: 'step-header', etape: 2, text: 'Localisation de la douleur' },
      { type: 'image', src: 'assets/rachis_complet.png', alt: 'Schéma du rachis', placeholder: 'Schéma rachis complet' },
      { type: 'narration', text: 'Sur la base des informations recueillies, quelle région du rachis allez-vous évaluer en priorité ?' }
    ],
    question: 'Région du rachis à évaluer en priorité :',
    choices: [
      { text: 'Rachis CERVICAL', next: 'LocalisationCervicale', correct: true },
      { text: 'Rachis THORACIQUE', next: 'LocalisationErreur' },
      { text: 'Rachis LOMBAIRE',   next: 'LocalisationErreur' }
    ]
  },

  'LocalisationErreur': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Le patient décrit explicitement des cervicalgies basses avec irradiation dans le membre supérieur. La région prioritaire est le rachis cervical.' }
    ],
    next: 'LocalisationCervicale'
  },

  'LocalisationCervicale': {
    type: 'step',
    content: [
      { type: 'feedback-success', text: 'Correct — Rachis CERVICAL' },
      { type: 'narration', text: 'Analysons maintenant le rythme et le type de la douleur avant de commencer l\'examen clinique.' }
    ],
    next: 'RythmeArguments',
    onEnter: (state) => { state.localisation = 'cervicale'; }
  },

  // ============================================================
  // 3. RAISONNEMENT — RYTHME / TYPE / FEU
  // Chaque étape : arguments à cocher + choix
  // ============================================================

  'RythmeArguments': {
    type: 'choix-argumente',
    scene: 'cabinet',
    titre: 'Rythme de la douleur',
    instructions: 'Cochez les éléments cliniques qui orientent votre analyse, puis sélectionnez votre réponse.',
    arguments: [
      { id: 'r1', texte: 'Douleur déclenchée et aggravée par les mouvements' },
      { id: 'r2', texte: 'Douleur soulagée par le repos' },
      { id: 'r3', texte: 'Douleur permanente au repos depuis 2 semaines' },
      { id: 'r4', texte: 'Réveils nocturnes vers 4h du matin' },
      { id: 'r5', texte: 'Dérouillage matinal de 45 minutes' },
      { id: 'r6', texte: 'Aggravation progressive depuis 2 mois' }
    ],
    question: 'Comment qualifiez-vous le rythme de cette douleur depuis 2 semaines ?',
    choices: [
      { text: 'Rythme MÉCANIQUE — lié aux mouvements et aux positions', next: 'RythmeErreur' },
      { text: 'Rythme MIXTE — mécanique et inflammatoire',              next: 'RythmeMixte', correct: true },
      { text: 'Rythme INFLAMMATOIRE — constant et nocturne',            next: 'RythmeErreur' }
    ]
  },

  'RythmeErreur': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Attention. Depuis 2 semaines : douleur permanente au repos + réveils nocturnes + dérouillage matinal 45 min. Ce n\'est plus un rythme purement mécanique.' },
      { type: 'narration', text: 'Les éléments inflammatoires (douleur nocturne, dérouillage) coexistent avec les éléments mécaniques (aggravation aux mouvements). → Rythme MIXTE.' }
    ],
    next: 'RythmeMixte'
  },

  'RythmeMixte': {
    type: 'step',
    scene: 'cabinet',
    content: [
      { type: 'feedback-success', text: 'Correct — Rythme MIXTE' },
      { type: 'narration', text: 'La douleur a évolué : initialement mécanique (fin de journée, positions), maintenant mixte avec composante inflammatoire (douleur nocturne, dérouillage 45 min).' }
    ],
    next: 'TypeDouleurArguments',
    onEnter: (state) => { state.rythme = 'mixte'; }
  },

  'TypeDouleurArguments': {
    type: 'choix-argumente',
    scene: 'cabinet',
    titre: 'Type de douleur',
    instructions: 'Cochez les éléments qui caractérisent le type de douleur, puis sélectionnez votre réponse.',
    arguments: [
      { id: 't1', texte: 'Douleur localisée en cervicales basses' },
      { id: 't2', texte: 'Irradiation dans l\'avant-bras jusqu\'au pouce' },
      { id: 't3', texte: 'Fourmillements permanents' },
      { id: 't4', texte: 'DN4 à 2 / 10 (seuil neuropathique : 4 / 10)' },
      { id: 't5', texte: 'Douleur aggravée par les mouvements cervicaux' },
      { id: 't6', texte: 'Absence de déficit moteur ou sensitif marqué' }
    ],
    question: 'Comment qualifiez-vous le type de cette douleur ?',
    choices: [
      { text: 'Douleur NOCICEPTIVE mécanique avec possible composante radiculaire',  next: 'TypeNociceptif', correct: true },
      { text: 'Douleur NEUROPATHIQUE franche (DN4 ≥ 4)',                              next: 'TypeErreurNeuropathique' },
      { text: 'Douleur NOCIPLASTIQUE',                                                next: 'TypeErreurNociplastique' }
    ]
  },

  'TypeErreurNeuropathique': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Le DN4 est à 2/10, en dessous du seuil de 4/10. Une neuropathie franche n\'est pas confirmée.' },
      { type: 'narration', text: 'Les fourmillements sont présents mais le score DN4 reste bas. Il s\'agit d\'une douleur nociceptive mécanique avec possible composante radiculaire (topographie en avant-bras jusqu\'au pouce).' }
    ],
    next: 'TypeNociceptif'
  },

  'TypeErreurNociplastique': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'La douleur nociplastique implique une sensibilisation centrale sans lésion tissulaire claire. Ce n\'est pas le profil de ce patient.' },
      { type: 'narration', text: 'Ici : discopathie C5-C6 identifiée à l\'IRM, irradiation topographique cohérente avec C6, douleur mécanique bien caractérisée. → Douleur nociceptive mécanique avec composante radiculaire possible.' }
    ],
    next: 'TypeNociceptif'
  },

  'TypeNociceptif': {
    type: 'step',
    scene: 'cabinet',
    content: [
      { type: 'feedback-success', text: 'Correct — Douleur nociceptive mécanique avec possible composante radiculaire' },
      { type: 'narration', text: 'Topographie en avant-bras jusqu\'au pouce cohérente avec un territoire C6. DN4 bas (2/10) : pas de neuropathie franche confirmée.' }
    ],
    next: 'FeuArguments',
    onEnter: (state) => { state.type_douleur = 'nociceptive_mecanique_radiculaire'; }
  },

  'FeuArguments': {
    type: 'choix-argumente',
    scene: 'cabinet',
    titre: 'Feu décisionnel — drapeaux rouges',
    instructions: 'Cochez les éléments qui orientent votre analyse des drapeaux rouges, puis sélectionnez votre réponse.',
    arguments: [
      { id: 'f1', texte: 'Pas de traumatisme récent ni chute' },
      { id: 'f2', texte: 'Pas de fièvre, pas d\'amaigrissement' },
      { id: 'f3', texte: 'Pas de déficit neurologique sévère' },
      { id: 'f4', texte: 'IRM récente : pas de conflit disco-radiculaire' },
      { id: 'f5', texte: 'Anxiété professionnelle, antécédents d\'arrêts travail (drapeau jaune)' },
      { id: 'f6', texte: 'Charge physique élevée, pression temporelle (drapeau bleu)' },
      { id: 'f7', texte: 'Rythme mixte avec composante inflammatoire modérée (drapeau orange)' }
    ],
    question: 'Détectez-vous des drapeaux rouges contre-indiquant la prise en charge ?',
    choices: [
      { text: 'FEU ROUGE — drapeaux rouges détectés, orientation médicale',    next: 'FeuRouge' },
      { text: 'FEU VERT — pas de drapeaux rouges, prise en charge indiquée',   next: 'FeuVert', correct: true }
    ]
  },

  'FeuRouge': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Erreur d\'analyse : aucun drapeau rouge majeur dans ce cas.' },
      { type: 'narration', text: 'Pas de traumatisme, pas de signes neurologiques sévères, pas de signes généraux (fièvre, amaigrissement). L\'IRM est récente et rassurante (pas de conflit radiculaire).' },
      { type: 'narration', text: 'Les éléments notés (drapeau jaune et drapeau bleu) sont des facteurs de chronicisation à prendre en compte dans la prise en charge, pas des contre-indications.' }
    ],
    next: 'FeuVert'
  },

  'FeuVert': {
    type: 'step',
    scene: 'cabinet',
    content: [
      { type: 'feedback-success', text: 'Feu VERT — Indication à la prise en charge chiropratique' },
      { type: 'info-block', label: 'Drapeau jaune', text: 'Anxiété vis-à-vis du travail, antécédents de rachialgie avec arrêt de travail.' },
      { type: 'info-block', label: 'Drapeau bleu',  text: 'Charge physique élevée, pression temporelle, peur de rechute.' }
    ],
    next: 'BilanDecisionnel',
    onEnter: (state) => { state.feu = 'vert'; }
  },

  'BilanDecisionnel': {
    type: 'bilan-decisionnel',
    scene: 'cabinet',
    next: 'ExamenClinique_Entree'
  },

  // ============================================================
  // TRANSITION — ENTRÉE EXAMEN CLINIQUE
  // ============================================================

  'ExamenClinique_Entree': {
    type: 'choix-libre',
    etape: '4',
    label: 'Examen clinique',
    scene: 'examen',
    titre: 'Examen clinique',
    content: [
      { type: 'step-header', etape: 4, text: 'Examen clinique' },
      { type: 'narration', text: 'Vous disposez de toutes les informations de l\'anamnèse. Monsieur F est prêt pour l\'examen.' }
    ],
    hint: 'Par quoi souhaitez-vous commencer ?',
    placeholder: '',
    optionsAttendues: [
      {
        keywords: ['obs*', 'obs*', 'regarde', 'posture', 'statique', 'je commence par voir'],
        next: 'Observation',
        correct: true
      }
    ],
    feedbackSiErreursFrequentes: {
      'amplitude': 'Une étape précède les amplitudes de mouvement. Réfléchissez à ce que vous faites habituellement en premier lorsqu\'un patient entre dans votre cabinet.',
      'test': 'Les tests spécifiques ne constituent pas la première étape de l\'examen clinique.'
    },
    feedbackParDefaut: 'Pensez à ce que vous faites avant toute mobilisation du patient.',
    fallbackNext: 'Observation'
  },

  // ============================================================
  // 4. OBSERVATION — SAISIE LIBRE
  // ============================================================

  'Observation': {
    type: 'observation-libre',
    etape: '4',
    label: 'Observation',
    scene: 'examen',
    intro: 'Observez Monsieur F debout. Vous disposez de trois vues : face, dos, profil.',
    images: [
      { src: 'assets/posture_face.png',   alt: 'Vue de face',  placeholder: 'Photo vue de face' },
      { src: 'assets/posture_dos.png',    alt: 'Vue de dos',   placeholder: 'Photo vue de dos' },
      { src: 'assets/posture_profil.png', alt: 'Vue de profil',placeholder: 'Photo vue de profil' }
    ],
    inputLabel: 'Décrivez ce que vous observez et ce que vous en déduisez :',
    inputHint: 'Décrivez ce que vous observez…',

    // Mots-clés détectant une mention de position antalgique → oblige à demander le mouvement opposé
    motsClésAntalgique: [
      'antalgique', 'antalgic', 'rotation', 'inclinaison', 'inflex*',
      'asymetrie', 'anteflexion', 'laterale', 'decale', 'penche',
      'tete en', 'tete a', 'position'
    ],

    // Résultat réel — donné uniquement après confirmation du mouvement opposé
    resultatsObservation: {
      normal: 'Position antalgique en légère rotation gauche avec attitude en antéflexion. Légère asymétrie des épaules.',
      confirmeParMouvementOppose: 'Rotation droite douloureuse et limitée confirmant la position antalgique en rotation gauche.'
    },

    // Pool pour la demande du mouvement opposé
    mouvementOppose: {
      keywords: ['rotation droite', 'tourne droite', 'mouvement oppose', 'cote oppose', 'côte droit', 'vers la droite'],
      dialogue: 'Aïe… tourner à droite c\'est douloureux et très limité.',
      dossierValue: 'Position antalgique : rotation gauche + antéflexion. Confirmée par douleur rotation droite.'
    },

    // Avertissement si l'étudiant veut avancer sans tester le mouvement opposé
    avertissementMouvementOppose: 'Vous avez noté une position antalgique. Avez-vous pensé à la confirmer en demandant au patient de réaliser le mouvement du côté opposé ?',

    next: 'AmplitudesActives'
  },

  // ============================================================
  // 5. AMPLITUDES ACTIVES — SAISIE LIBRE
  // ============================================================

  'AmplitudesActives': {
    type: 'examen-libre',
    phase: 'amplitudes-actives',
    etape: 5,
    label: 'Examen actif',
    scene: 'examen',
    intro: 'Que souhaitez-vous évaluer en premier ?',
    hint: 'Que souhaitez-vous faire ?',
    legendeQualification: false,

    // Chaque entrée du pool : keywords, résultat, vidéo, dialogue patient, valeur dossier
    pool: {
      flexion: {
        keywords: ['flex*', 'tete en avant', 'pencher en avant', 'inclinaison anterieure', 'antepulsion'],
        label: 'Flexion',
        stateKey: 'flexion_active',
        resultat: 'F-ND',
        video: { src: 'assets/flexion.mp4', placeholder: 'Vidéo flexion cervicale' },
        dialogues: ['(Il penche la tête en avant sans difficulté)'],
        dossierValue: 'Flexion : F-ND'
      },
      extension: {
        keywords: ['extens*', 'tete en arriere', 'pencher en arriere', 'inclinaison posterieure', 'reclinaison'],
        label: 'Extension',
        stateKey: 'extension_active',
        resultat: 'NF-D',
        video: { src: 'assets/extension.mp4', placeholder: 'Vidéo extension cervicale' },
        dialogues: [
          '(Il penche la tête en arrière avec difficulté)',
          'Aïe… Ça tire dans les cervicales basses à droite, et ça lance dans le bras !'
        ],
        dossierValue: 'Extension : NF-D (cervicales basses D + interscapulaire + bras)'
      },
      inflexion_droite: {
        keywords: ['inflexion droite', 'inclinaison droite', 'lateralite droite', 'penche droite', 'incline droite', 'inflexion a droite'],
        label: 'Inflexion droite',
        stateKey: 'inflexion_D_active',
        resultat: 'NF-D',
        video: { src: 'assets/inflexion_droite.mp4', placeholder: 'Vidéo inflexion droite' },
        dialogues: [
          '(Il incline la tête à droite avec difficulté)',
          'Ça tire aussi… cervicales basses à droite et interscapulaire.'
        ],
        dossierValue: 'Inflexion droite : NF-D (cervicales basses D + interscapulaire)'
      },
      inflexion_gauche: {
        keywords: ['inflexion gauche', 'inclinaison gauche', 'lateralite gauche', 'penche gauche', 'incline gauche', 'inflexion a gauche'],
        label: 'Inflexion gauche',
        stateKey: 'inflexion_G_active',
        resultat: 'F-D',
        video: { src: 'assets/inflexion_gauche.mp4', placeholder: 'Vidéo inflexion gauche' },
        dialogues: [
          '(Il incline la tête à gauche sans limitation, mais grimace)',
          'Ça passe… mais ça tire quand même côté droit.'
        ],
        dossierValue: 'Inflexion gauche : F-D (douleur côté cervical droit)'
      },
      rotation_droite: {
        keywords: ['rotation droite', 'rotation a droite', 'rotation vers la droite', 'tourne droite', 'tourner a droite'],
        label: 'Rotation droite',
        stateKey: 'rotation_D_active',
        resultat: 'NF-D',
        video: { src: 'assets/rotation_droite.mp4', placeholder: 'Vidéo rotation droite' },
        dialogues: [
          '(Il tourne la tête à droite difficilement)',
          'Aïe ! C\'est très limité et ça lance dans le bras.'
        ],
        dossierValue: 'Rotation droite : NF-D (très limitée + bras D)'
      },
      rotation_gauche: {
        keywords: ['rotation gauche', 'rotation a gauche', 'rotation vers la gauche', 'tourne gauche', 'tourner a gauche'],
        label: 'Rotation gauche',
        stateKey: 'rotation_G_active',
        resultat: 'F-ND',
        video: { src: 'assets/rotation_gauche.mp4', placeholder: 'Vidéo rotation gauche' },
        dialogues: ['(Il tourne la tête à gauche sans problème)'],
        dossierValue: 'Rotation gauche : F-ND'
      },
      protraction: {
        keywords: ['protract*', 'projection anterieure', 'tete en avant', 'anteprojection', 'avancer la tete'],
        label: 'Protraction',
        stateKey: 'protraction_active',
        resultat: 'F-ND',
        video: { src: 'assets/protraction.mp4', placeholder: 'Vidéo protraction' },
        dialogues: ['(Il avance la tête sans douleur ni limitation)'],
        dossierValue: 'Protraction : F-ND'
      },
      retraction: {
        keywords: ['retract*', 'recul de la tete', 'rectracion', 'tete en arriere', 'reculer la tete', 'chin tuck'],
        label: 'Rétraction',
        stateKey: 'retraction_active',
        resultat: 'F-ND',
        video: { src: 'assets/retraction.mp4', placeholder: 'Vidéo rétraction' },
        dialogues: ['(Il recule la tête sans douleur ni limitation)'],
        dossierValue: 'Rétraction : F-ND'
      }
    },

    // Mouvements obligatoires (avertissement si non testés)
    obligatoires: ['flex*', 'extens*', 'inflexion_droite', 'inflexion_gauche', 'rotation_droite', 'rotation_gauche'],
    // Mouvements importants mais non bloquants
    importants: ['protract*', 'retract*'],

    messageAvertissementOublis: 'Avant de passer aux tests, vous n\'avez pas évalué les mouvements suivants :',
    messageAvertissementImportants: 'Il est également conseillé de tester :',

    next: 'TestsExamen'
  },

  // ============================================================
  // 6. TESTS ORTHOPÉDIQUES + DIFFÉRENTIATION — SAISIE LIBRE
  // ============================================================

  'TestsExamen': {
    type: 'examen-libre',
    phase: 'tests',
    etape: 6,
    label: 'Tests cliniques',
    scene: 'examen',
    intro: 'Poursuivez votre examen.',
    hint: 'Que souhaitez-vous faire ?',

    pool: {
      // ——— Tests orthopédiques ———
      spurling: {
        keywords: ['spurling', 'compress*', 'test de compression', 'compression cervicale', 'test spurling'],
        label: 'Test de Spurling (compression)',
        stateKey: 'spurling',
        resultat: 'Douleur locale uniquement — pas d\'irradiation',
        interpretation: 'négatif pour conflit disco-radiculaire',
        image: { src: 'assets/test_compression.png', alt: 'Test de Spurling', placeholder: 'Photo test Spurling' },
        dialogues: [
          'Vous appuyez verticalement sur la tête de Monsieur F.',
          '(Monsieur F grimace légèrement)',
          'Ça fait mal localement dans la nuque… mais ça ne descend pas dans le bras.'
        ],
        dossierValue: 'Spurling : douleur locale uniquement — négatif conflit radiculaire'
      },
      distraction: {
        keywords: ['distract*', 'test de distraction', 'traction cervicale', 'decoaptation'],
        label: 'Test de distraction',
        stateKey: 'distract*',
        resultat: 'Tiraillement cervical bas seulement — pas de soulagement radiculaire',
        interpretation: 'négatif pour conflit disco-radiculaire',
        image: { src: 'assets/test_distraction.png', alt: 'Test de distraction', placeholder: 'Photo test distraction' },
        dialogues: [
          'Vous tirez doucement la tête de Monsieur F vers le haut.',
          'Ça tire en bas de la nuque… mais le bras, ça ne change pas vraiment.'
        ],
        dossierValue: 'Distraction : tiraillement cervical bas — négatif conflit radiculaire'
      },
      arm_squeeze_test: {
        keywords: ['arm squeeze', 'arm squeeze test', 'squeeze', 'pression bras', 'compression bras'],
        label: 'Arm Squeeze Test',
        stateKey: 'arm_squeeze_test',
        resultat: 'NÉGATIF',
        interpretation: 'pas de douleur reproductible à la compression du bras',
        image: { src: 'assets/test_arm_squeeze.png', alt: 'Arm Squeeze Test', placeholder: 'Photo Arm Squeeze Test' },
        dialogues: [
          'Vous comprimez le tiers moyen du bras droit de Monsieur F.',
          '(Monsieur F ne ressent pas de douleur particulière)',
          'Non, ça ne me fait pas mal là.'
        ],
        dossierValue: 'Arm Squeeze Test : négatif'
      },
      bakody: {
        keywords: ['bakody', 'main sur la tete', 'abduction epaule', 'abduction passif bras', 'shoulder abduction test'],
        label: 'Test de Bakody',
        stateKey: 'bakody',
        resultat: 'Aucun soulagement de l\'irradiation',
        interpretation: 'négatif',
        image: { src: 'assets/test_bakody.png', alt: 'Test de Bakody', placeholder: 'Photo test Bakody' },
        dialogues: [
          'Vous guidez le bras droit en abduction et posez la main de Monsieur F sur sa tête.',
          'Non, je ne sens pas de différence dans le bras.'
        ],
        dossierValue: 'Bakody : négatif'
      },
      valsalva: {
        keywords: ['valsalva', 'toux', 'poussee abdominale', 'expiration forcee', 'effort de poussee'],
        label: 'Manœuvre de Valsalva',
        stateKey: 'valsalva',
        resultat: 'Pas d\'irradiation reproduite',
        interpretation: 'négatif',
        dialogues: [
          'Vous demandez à Monsieur F de bloquer sa respiration et de pousser.',
          'Non, ça ne fait pas descendre la douleur dans le bras.'
        ],
        dossierValue: 'Valsalva : négatif'
      },

      // ——— Tests de différentiation ———
      flexion_rotation: {
        keywords: ['flexion rotation', 'test de flexion rotation', 'flexion puis rotation', 'frt', 'flexion-rotation'],
        label: 'Test de flexion-rotation',
        stateKey: 'flexion_rotation',
        resultat: 'Fonctionnel et non douloureux — NÉGATIF',
        interpretation: 'pas d\'atteinte C1-C2',
        image: { src: 'assets/test_flexion_rotation.png', alt: 'Test flexion-rotation', placeholder: 'Photo test flexion-rotation' },
        dialogues: [
          'Vous placez Monsieur F en flexion cervicale maximale, puis testez la rotation.',
          '(Le mouvement se fait sans douleur ni limitation particulière)'
        ],
        dossierValue: 'Flexion-rotation : négatif (fonctionnel, non douloureux)'
      },
      differentiation_cervico_thoracique: {
        keywords: [
          'ctdt', 'differenciation cervico', 'cervico thoracique', 'blocage thoracique',
          'differentiation cervicale', 'test de differentiation', 'ctdt test',
          'cervicothoracique'
        ],
        label: 'Test de différentiation cervico-thoracique',
        stateKey: 'ctdt',
        resultat: 'Peu d\'amélioration pour toutes les amplitudes',
        interpretation: 'origine majoritairement cervicale',
        image: { src: 'assets/test_ctdt.png', alt: 'Test C-T-D-T', placeholder: 'Photo test différentiation' },
        dialogues: [
          'Vous bloquez le rachis thoracique et testez les rotations cervicales isolées.',
          'Euh… c\'est à peu près pareil, ça ne change pas vraiment.'
        ],
        dossierValue: 'Différentiation cervico-thoracique : origine cervicale (peu d\'amélioration au blocage thoracique)'
      }
    },

    // Tests essentiels à réaliser (avertissement si oubliés)
    obligatoires: ['spurling', 'distract*', 'arm_squeeze_test'],
    importants:   ['flexion_rotation', 'differentiation_cervico_thoracique', 'bakody'],

    messageAvertissementOublis: 'Avant de passer à l\'étape suivante, vous n\'avez pas réalisé les tests suivants :',
    messageAvertissementImportants: 'Il est également conseillé de réaliser :',

    next: 'RaisonnementPassives'
  },

  // ============================================================
  // 7. RAISONNEMENT — LES PASSIVES SONT-ELLES INDIQUÉES ?
  // ============================================================

  'RaisonnementPassives': {
    type: 'step',
    etape: 7,
    label: 'Raisonnement clinique',
    scene: 'examen',
    content: [
      { type: 'step-header', etape: 7, text: 'Raisonnement clinique' },
      { type: 'recap-header', text: 'Bilan des tests orthopédiques' },
      { type: 'findings', items: [
        { label: 'Spurling',            text: 'Douleur locale uniquement — pas d\'irradiation' },
        { label: 'Distraction',         text: 'Tiraillement cervical bas — pas de soulagement radiculaire' },
        { label: 'Arm Squeeze Test',    text: 'Négatif' }
      ]},
      { type: 'info-block', label: 'Rappel IRM', text: 'Discopathie C5-C6 — pas de conflit disco-radiculaire.' },
      { type: 'narration', text: 'Au vu de ces résultats, les amplitudes passives sont-elles indiquées ?' }
    ],
    question: 'Les amplitudes de mouvement passives sont-elles réalisables ?',
    choices: [
      {
        text: 'Oui, les amplitudes passives sont réalisables dans ce contexte',
        next: 'AmplitudesPassives',
        correct: true
      },
      {
        text: 'Non, je ne les réalise pas dans ce contexte',
        next: 'RaisonnementPassives_Erreur'
      }
    ]
  },

  'RaisonnementPassives_Erreur': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Attention au raisonnement. En thérapie manuelle, le passif est contre-indiqué en cas de conflit disco-radiculaire avéré.' },
      { type: 'narration', text: 'Relisez les résultats des tests orthopédiques et le compte rendu IRM. Ils contiennent les éléments permettant de statuer sur l\'indication.' }
    ],
    next: 'AmplitudesPassives'
  },

  // ============================================================
  // 8. AMPLITUDES PASSIVES — SAISIE LIBRE
  // Règle : tester uniquement les mouvements F-D / NF-D / NF-ND
  // Pas les F-ND (fonctionnels et non douloureux)
  // ============================================================

  'AmplitudesPassives': {
    type: 'examen-libre',
    phase: 'amplitudes-passives',
    etape: 8,
    label: 'Examen passif',
    scene: 'examen',
    intro: 'Poursuivez votre examen.',
    hint: 'Que souhaitez-vous faire ?',

    pool: {
      extension_passive: {
        keywords: [
          'extension passive', 'extension en passif', 'extension guidee',
          'je guide l\'extens*', 'tester extension passif'
        ],
        label: 'Extension passive',
        stateKey: 'extension_passive',
        resultat: 'NF-D',
        actifReference: 'extension_active',
        video: { src: 'assets/extension_passive.mp4', placeholder: 'Vidéo extension passive' },
        dialogues: [
          'Vous guidez passivement l\'extension cervicale.',
          '(Légère amélioration de l\'amplitude par rapport à l\'actif, mais encore limitée et douloureuse)'
        ],
        dossierValue: 'Extension passive : NF-D (légère amélioration / actif)'
      },
      inflexion_droite_passive: {
        keywords: [
          'inflexion droite passive', 'inflexion droite en passif',
          'je guide l\'inflexion droite', 'inclinaison droite passive'
        ],
        label: 'Inflexion droite passive',
        stateKey: 'inflexion_D_passive',
        actifReference: 'inflexion_D_active',
        resultat: 'NF-D',
        video: { src: 'assets/inflexion_droite_passive.mp4', placeholder: 'Vidéo inflexion droite passive' },
        dialogues: [
          'Vous guidez passivement l\'inflexion droite.',
          '(Légère amélioration, mais reste limitée et douloureuse)'
        ],
        dossierValue: 'Inflexion droite passive : NF-D (légère amélioration / actif)'
      },
      inflexion_gauche_passive: {
        keywords: [
          'inflexion gauche passive', 'inflexion gauche en passif',
          'je guide l\'inflexion gauche', 'inclinaison gauche passive'
        ],
        label: 'Inflexion gauche passive',
        stateKey: 'inflexion_G_passive',
        actifReference: 'inflexion_G_active',
        resultat: 'F-D',
        video: { src: 'assets/inflexion_gauche_passive.mp4', placeholder: 'Vidéo inflexion gauche passive' },
        dialogues: [
          'Vous guidez passivement l\'inflexion gauche.',
          '(Fonctionnelle, légère amélioration, mais toujours douloureuse côté droit)'
        ],
        dossierValue: 'Inflexion gauche passive : F-D (légère amélioration / actif)'
      },
      rotation_droite_passive: {
        keywords: [
          'rotation droite passive', 'rotation droite en passif',
          'je guide la rotation droite', 'rotation passive droite'
        ],
        label: 'Rotation droite passive',
        stateKey: 'rotation_D_passive',
        actifReference: 'rotation_D_active',
        resultat: 'NF-D',
        video: { src: 'assets/rotation_droite_passive.mp4', placeholder: 'Vidéo rotation droite passive' },
        dialogues: [
          'Vous guidez passivement la rotation droite.',
          '(Légère amélioration, mais reste limitée et douloureuse)'
        ],
        dossierValue: 'Rotation droite passive : NF-D (légère amélioration / actif)'
      },

      // ——— Mouvements non indiqués (F-ND en actif) ———
      // Si l'étudiant les demande → feedback pédagogique (non bloquant)
      flexion_passive: {
        keywords: ['flexion passive', 'flexion en passif', 'je guide la flexion'],
        label: 'Flexion passive',
        stateKey: null,
        resultat: null,
        nonIndique: true,
        feedbackNonIndique: 'La flexion était fonctionnelle et non douloureuse en actif (F-ND). Un mouvement F-ND en actif n\'est pas indiqué en passif car il ne présente ni dysfonction ni douleur à explorer passivement.'
      },
      rotation_gauche_passive: {
        keywords: ['rotation gauche passive', 'rotation gauche en passif', 'je guide la rotation gauche'],
        label: 'Rotation gauche passive',
        stateKey: null,
        resultat: null,
        nonIndique: true,
        feedbackNonIndique: 'La rotation gauche était fonctionnelle et non douloureuse en actif (F-ND). Un mouvement F-ND en actif n\'est pas indiqué en passif.'
      },
      protraction_passive: {
        keywords: ['protraction passive', 'protraction en passif'],
        label: 'Protraction passive',
        stateKey: null,
        resultat: null,
        nonIndique: true,
        feedbackNonIndique: 'La protraction était fonctionnelle et non douloureuse en actif (F-ND). Pas d\'indication de la tester en passif.'
      },
      retraction_passive: {
        keywords: ['retraction passive', 'retraction en passif'],
        label: 'Rétraction passive',
        stateKey: null,
        resultat: null,
        nonIndique: true,
        feedbackNonIndique: 'La rétraction était fonctionnelle et non douloureuse en actif (F-ND). Pas d\'indication de la tester en passif.'
      }
    },

    obligatoires: ['extension_passive', 'inflexion_droite_passive', 'inflexion_gauche_passive', 'rotation_droite_passive'],
    importants: [],

    messageAvertissementOublis: 'Vous n\'avez pas testé les mouvements passifs suivants, pourtant indiqués (F-D ou NF-D en actif) :',

    next: 'OnBrancleLeCerveau'
  },

  // ============================================================
  // 9. ON BRANCHE LE CERVEAU — CLASSIFICATION DES DYSFONCTIONS
  // Multi-sélect par amplitude passive
  // ============================================================

  'OnBrancleLeCerveau': {
    type: 'cerveau-branche',
    etape: 9,
    label: 'On branche le cerveau',
    scene: 'examen',
    intro: 'Analysez chaque amplitude testée en passif. Cochez la ou les dysfonctions qui correspondent à vos observations.',
    instructions: 'Pour chaque mouvement, cochez votre hypothèse, puis répondez à la question de conduite.',

    mouvements: [
      {
        id: 'extens*',
        label: 'Extension',
        actifKey: 'extension_active',
        passifKey: 'extension_passive',
        description: 'Actif : NF-D — Passif : NF-D (légère amélioration non significative)'
      },
      {
        id: 'inflexion_droite',
        label: 'Inflexion droite',
        actifKey: 'inflexion_D_active',
        passifKey: 'inflexion_D_passive',
        description: 'Actif : NF-D — Passif : NF-D (légère amélioration non significative)'
      },
      {
        id: 'inflexion_gauche',
        label: 'Inflexion gauche',
        actifKey: 'inflexion_G_active',
        passifKey: 'inflexion_G_passive',
        description: 'Actif : F-D — Passif : F-D (légère amélioration non significative)'
      },
      {
        id: 'rotation_droite',
        label: 'Rotation droite',
        actifKey: 'rotation_D_active',
        passifKey: 'rotation_D_passive',
        description: 'Actif : NF-D — Passif : NF-D (légère amélioration non significative)'
      }
    ],

    // Options affichées sous forme de cases à cocher pour chaque mouvement
    options: [
      { id: 'pas_de_dysfonction',        label: 'Pas de dysfonction' },
      { id: 'dysfonction_musculaire',     label: 'Dysfonction musculaire' },
      { id: 'dysfonction_articulaire',    label: 'Dysfonction articulaire' },
      { id: 'controle_moteur',            label: 'Dysfonction de contrôle moteur' },
      { id: 'tissulaire_extensibilite',   label: 'Dysfonction tissulaire d\'extensibilité' }
    ],

    // Question posée après le choix des cases
    questionConduite: 'Pour ce mouvement, souhaitez-vous continuer l\'examen ou vous arrêter à cette étape ?',
    choixConduite: [
      { id: 'continuer', label: 'Continuer l\'examen pour ce mouvement' },
      { id: 'arreter',   label: 'S\'arrêter à cette étape pour ce mouvement' }
    ],

    // Logique de feedback (traitée dans app.js)
    regles: {
      // Seule combinaison correcte : articulaire ET tissulaire_extensibilite cochés ensemble
      combinaisonCorrecte: ['dysfonction_articulaire', 'tissulaire_extensibilite'],

      feedbacks: {
        // Combinaison correcte
        articulaire_et_tissulaire: {
          type: 'success',
          texte: 'Correct. Actif = Passif (sans amélioration significative) : on ne peut pas encore distinguer dysfonction articulaire et dysfonction tissulaire d\'extensibilité. Les deux restent possibles à ce stade — la palpation permettra de préciser.'
        },
        // Contrôle moteur coché
        controle_moteur: {
          type: 'info',
          texteArret: 'Correct dans le cadre du contrôle moteur : on s\'arrête ici. La dysfonction de contrôle moteur ne peut être confirmée que si le passif dépasse significativement l\'actif. Ce n\'est pas le cas ici — mais la notion de contrôle moteur fait partie du cursus à venir.',
          texteContinuer: 'Attention : si vous avez coché contrôle moteur, la bonne conduite est de s\'arrêter à cette étape (le contrôle moteur ne peut être évalué davantage sans tests spécifiques non abordés ici).'
        },
        // Musculaire seul
        musculaire_seul: {
          type: 'warning',
          texte: 'Imprécis : dysfonction musculaire seule est trop vague à ce stade. Elle peut englober une dysfonction de contrôle moteur ou une dysfonction tissulaire d\'extensibilité. Il faut préciser.'
        },
        // Articulaire seul (sans tissulaire)
        articulaire_seul: {
          type: 'warning',
          texte: 'Incomplet : vous avez identifié la dysfonction articulaire, mais actif = passif ne vous permet pas encore d\'écarter une dysfonction tissulaire d\'extensibilité. Cochez les deux.'
        },
        // Tissulaire seul (sans articulaire)
        tissulaire_seul: {
          type: 'warning',
          texte: 'Incomplet : vous avez identifié la dysfonction tissulaire d\'extensibilité, mais actif = passif ne vous permet pas encore d\'écarter une dysfonction articulaire. Cochez les deux.'
        },
        // Pas de dysfonction
        pas_de_dysfonction: {
          type: 'error',
          texte: 'Erreur : tous ces mouvements sont non fonctionnels et/ou douloureux en actif comme en passif. Une dysfonction est bien présente.'
        }
      }
    },

    next: 'Transition_Palpation'
  },

  // ============================================================
  // TRANSITION — VERS PALPATION
  // ============================================================

  'Transition_Palpation': {
    type: 'choix-libre',
    scene: 'examen',
    content: [
      { type: 'narration', text: 'Vous avez analysé les amplitudes passives. Comment poursuivez-vous votre examen ?' }
    ],
    hint: 'Quelle est la prochaine étape de votre examen ?',
    placeholder: '',
    optionsAttendues: [
      {
        keywords: ['palp*', 'palp*', 'palp*', 'toucher', 'mobilisation segmentaire', 'pression'],
        next: 'PalpationDynamique',
        correct: true
      }
    ],
    feedbackParDefaut: 'Réfléchissez à l\'étape qui vous permettrait d\'affiner votre hypothèse diagnostique.',
    fallbackNext: 'PalpationDynamique'
  },

  // ============================================================
  // 10. PALPATION DYNAMIQUE + STATIQUE
  // ============================================================

  'PalpationDynamique': {
    type: 'step',
    etape: 10,
    label: 'Examen palpatoire',
    scene: 'examen',
    content: [
      { type: 'step-header', etape: 10, text: 'Examen palpatoire' },
      { type: 'narration', text: 'Vous palpez les segments vertébraux pendant les mouvements actifs dysfonctionnels.' },
      { type: 'findings', items: [
        { label: 'Extension cervicale',     text: 'Douloureux au niveau de C6-C7' },
        { label: 'Inflexion droite / gauche', text: 'Douloureux en C6-C7 (prédominant à droite) + reproduction légère douleur interscapulaire et bras droit' },
        { label: 'Rotation droite / gauche', text: 'Douloureux en C6-C7 (prédominant à droite) + reproduction douleur bras' },
        { label: 'Thoracique',               text: 'Sensibilité en T3-T4 (secondaire)' }
      ]}
    ],
    question: 'Quel est le niveau vertébral dysfonctionnel principal ?',
    choices: [
      { text: 'C6-C7',   next: 'PalpationDynamique_Correct', correct: true },
      { text: 'C5-C6',   next: 'PalpationDynamique_Erreur' },
      { text: 'T3-T4',   next: 'PalpationDynamique_Erreur' }
    ]
  },

  'PalpationDynamique_Erreur': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'La douleur et la dysfonction sont reproduites de manière constante au niveau C6-C7. T3-T4 présente une sensibilité secondaire.' }
    ],
    next: 'PalpationDynamique_Correct'
  },

  'PalpationDynamique_Correct': {
    type: 'step',
    content: [{ type: 'feedback-success', text: 'Correct — Niveau dysfonctionnel : C6-C7 à droite' }],
    next: 'PalpationStatique',
    onEnter: (state) => { state.niveau_vertebral = 'C6-C7'; }
  },

  'PalpationStatique': {
    type: 'step',
    scene: 'examen',
    content: [
      { type: 'test-header', text: 'Palpation statique' },
      { type: 'findings', items: [
        { label: 'Signe de la sonnette',          text: 'Présent en C6-C7 à droite' },
        { label: 'Épineuses',                     text: 'Douleur à la palpation en C6-C7' },
        { label: 'Articulaires postérieures',     text: 'Douleur à la palpation en C6-C7' },
        { label: 'Palper-rouler interscapulaire', text: 'Sensible à droite' }
      ]},
      { type: 'narration', text: 'Analysez ces données de palpation pour affiner votre hypothèse diagnostique.' }
    ],
    next: 'MouvementsRepetes'
  },

  // ============================================================
  // 11. MOUVEMENTS RÉPÉTÉS — PRÉFÉRENCE DIRECTIONNELLE
  // ============================================================

  'MouvementsRepetes': {
    type: 'step',
    etape: 11,
    label: 'Examen complémentaire',
    scene: 'examen',
    content: [
      { type: 'step-header', etape: 11, text: 'Examen complémentaire' },
      { type: 'narration', text: 'Vous faites réaliser des mouvements répétés en fin d\'amplitude pour identifier une éventuelle préférence directionnelle.' },
      { type: 'findings', items: [
        { label: 'Rétraction répétée',          text: 'Amélioration de la douleur et de la fonction' },
        { label: 'Inflexion droite répétée',     text: 'Amélioration de la douleur et de la fonction' }
      ]}
    ],
    question: 'Y a-t-il une préférence directionnelle ?',
    choices: [
      { text: 'Oui, une préférence directionnelle est identifiée', next: 'PreferenceDirectionnelle_Oui', correct: true },
      { text: 'Non, aucune préférence directionnelle identifiée', next: 'PreferenceDirectionnelle_Non' }
    ]
  },

  'PreferenceDirectionnelle_Non': {
    type: 'error',
    content: [
      { type: 'feedback-error', text: 'Les mouvements répétés en rétraction ET inflexion droite améliorent les symptômes → préférence directionnelle identifiée.' }
    ],
    next: 'PreferenceDirectionnelle_Oui'
  },

  'PreferenceDirectionnelle_Oui': {
    type: 'step',
    content: [
      { type: 'feedback-success', text: 'Correct — Préférence directionnelle : Rétraction + Inflexion droite' },
      { type: 'narration', text: '→ Bon pronostic de récupération.' }
    ],
    next: 'PriseEnCharge',
    onEnter: (state) => {
      state.preference_directionnelle = 'rétraction + inflexion droite';
      state.pronostic = 'bon';
    }
  },

  // ============================================================
  // 12. PRISE EN CHARGE
  // ============================================================

  'PriseEnCharge': {
    type: 'step',
    etape: 12,
    label: 'Prise en charge',
    scene: 'cabinet',
    content: [
      { type: 'step-header', etape: 12, text: 'Prise en charge' },
      { type: 'diagnostic-block', title: 'Diagnostic chiropratique', items: [
        'Cervicalgie basse mécanique droite avec radiculalgie C6',
        'Dysfonction articulaire segmentaire C6-C7 à droite',
        'Composante inflammatoire secondaire (rythme mixte depuis 2 semaines)',
        'Préférence directionnelle : rétraction + inflexion droite'
      ]},
      { type: 'diagnostic-block', title: 'Plan de traitement', items: [
        'Mobilisations articulaires C6-C7 à droite',
        'Exercices en rétraction cervicale répétée',
        'Exercices d\'inflexion droite en fin d\'amplitude',
        'Contrôle moteur cervical — stabilisation profonde',
        'Éducation thérapeutique — postures de travail, ergonomie',
        'Gestion des drapeaux jaunes et bleus (anxiété, charge de travail)'
      ]},
      { type: 'dialogue', speaker: 'Monsieur F', text: 'Merci. Donc je vais pouvoir continuer à travailler ?' },
      { type: 'narration', text: '"Oui, mais avec des adaptations. Voici vos exercices à domicile. Nous allons travailler ensemble sur la durée."' }
    ],
    next: 'Conclusion'
  },

  // ============================================================
  // CONCLUSION — BILAN FINAL + TÉLÉCHARGEMENT PDF
  // ============================================================

  'Conclusion': {
    type: 'conclusion',
    scene: 'cabinet',
    content: [
      { type: 'step-header', etape: '✓', text: 'Fin de l\'évaluation' },
      { type: 'narration', text: 'Vous avez complété l\'évaluation clinique du rachis cervical de Monsieur F.' },
      { type: 'recap-final' }
    ],
    choices: [
      { text: '📄 Télécharger mon bilan (PDF)', next: null,                action: 'downloadPDF' },
      { text: '📋 Voir le récapitulatif complet', next: 'RecapitulatifFinal' },
      { text: '🔄 Recommencer l\'évaluation',    next: 'Start',            restart: true }
    ]
  },

  'RecapitulatifFinal': {
    type: 'recap',
    content: [{ type: 'full-recap' }],
    choices: [
      { text: '📄 Télécharger mon bilan (PDF)', next: null,  action: 'downloadPDF' },
      { text: '🔄 Recommencer',                 next: 'Start', restart: true }
    ]
  }

};