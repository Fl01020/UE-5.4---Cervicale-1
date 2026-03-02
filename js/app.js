/* ============================================================
   APP ENGINE — Rachis Cervical — Monsieur F
   ============================================================
   Gère la navigation, le rendu, l'état clinique.
   Supporte 15 types d'étapes définis dans scenarios.js.
   ============================================================ */

const App = (() => {

  // ============================================================
  // ÉTAT GLOBAL
  // ============================================================

  let state        = {};   // données cliniques accumulées
  let currentStep  = 'Start';
  let navHistory   = [];
  let errors       = 0;
  let totalChoices = 0;
  let mobileUserClosed = false;   // vrai si l'utilisateur a fermé le dossier sur mobile

  // État interrogatoire anamnèse
  let interrogatoire = {
    active:       false,
    askedTopics:  new Set(),
    chatLog:      [],
    offTopicIndex: 0
  };

  // État des phases d'examen libre (amplitudes actives, tests, passives)
  // Clé = phase id ('amplitudes-actives' | 'tests' | 'amplitudes-passives')
  let examenLibreState = {};

  // État observation
  let observationState = {
    descriptionDonnee:     false,
    antalgiqueMentionne:   false,
    mouvementOpposeDemandeé: false,
    chatLog:               []
  };

  // État "On branche le cerveau" : sélections par mouvement
  let cerveauState = {};

  // Arguments cochés dans les étapes choix-argumente
  let argumentsCoches = {};

  // ============================================================
  // DOM
  // ============================================================

  const dom = {
    content:       () => document.getElementById('content'),
    choices:       () => document.getElementById('choices'),
    choicesWrap:   () => document.getElementById('choices-wrap'),
    progress:      () => document.getElementById('progress-fill'),
    scene:         () => document.getElementById('scene-bg'),
    dossierPanel:  () => document.getElementById('dossier-panel'),
    dossierFields: () => document.getElementById('dossier-fields'),
    dossierTitle:  () => document.getElementById('dossier-title'),
    examSection:   () => document.getElementById('dossier-exam-section'),
    examFields:    () => document.getElementById('dossier-exam-fields')
  };

  // ============================================================
  // ÉTAPES PROGRESSION
  // ============================================================

  const ETAPES = [
    { id: 'Anamnese',              label: 'Anamnèse',            num: 1  },
    { id: 'Localisation',          label: 'Localisation',        num: 2  },
    { id: 'RythmeArguments',       label: 'Raisonnement',        num: 3  },
    { id: 'ExamenClinique_Entree', label: 'Examen clinique',     num: 4  },
    { id: 'Observation',           label: 'Observation',         num: 5  },
    { id: 'AmplitudesActives',     label: 'Amplitudes actives',  num: 6  },
    { id: 'TestsExamen',           label: 'Tests',               num: 7  },
    { id: 'AmplitudesPassives',    label: 'Amplitudes passives', num: 8  },
    { id: 'OnBrancleLeCerveau',    label: 'Cerveau branché',     num: 9  },
    { id: 'PalpationDynamique',    label: 'Palpation',           num: 10 },
    { id: 'MouvementsRepetes',     label: 'Préf. direct.',       num: 11 },
    { id: 'PriseEnCharge',         label: 'Prise en charge',     num: 12 }
  ];

  const ALL_TOPICS_ORDER = [
    'localisation', 'duree', 'nuit', 'derouillage', 'eva', 'dn4',
    'mecanisme_survenue', 'facteurs', 'antecedents', 'travail',
    'signes_generaux', 'force', 'traitement'
  ];

  // ============================================================
  // SCÈNES
  // ============================================================

  const SCENES = {
    cabinet: 'linear-gradient(135deg, #e8f4f8 0%, #d6eaf8 40%, #aed6f1 100%)',
    examen:  'linear-gradient(135deg, #eafaf1 0%, #d5f5e3 40%, #a9dfbf 100%)',
    alerte:  'linear-gradient(135deg, #fef9e7 0%, #fdebd0 40%, #f9d191 100%)'
  };

  function setScene(scene) {
    const bg = dom.scene();
    if (bg && scene) bg.style.background = SCENES[scene] || SCENES.cabinet;
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Distance de Levenshtein (édition simple — insertions, suppressions, substitutions)
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
        row[j - 1] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  }

  /**
   * matchKeyword(keyword, inputNormalized)
   *
   * Supporte trois modes :
   *   1. Mot-clé normal  → "observation"  : substring exact (actuel)
   *   2. Préfixe (*)     → "obs*"         : l'entrée contient un mot qui commence par "obs"
   *   3. Tolérance typo  → auto si mot ≥ 5 car. : distance Levenshtein ≤ 1 entre
   *                         chaque mot de l'entrée et le mot-clé (ou son préfixe)
   *
   * Le * peut aussi être utilisé dans les scenarios.js : 'palp*', 'obs*', 'retract*', etc.
   */
  function matchKeyword(kw, inp) {
    const nkw = normalize(kw);

    // Mode préfixe : keyword se termine par *
    if (nkw.endsWith('*')) {
      const prefix = nkw.slice(0, -1);          // ex. "obs"
      // Vérifier chaque mot de l'entrée
      const words = inp.split(/[\s,;\/]+/);
      return words.some(w => w.startsWith(prefix));
    }

    // Mode normal : substring
    if (inp.includes(nkw)) return true;

    // Mode tolérance typo pour mots ≥ 5 caractères
    // On découpe l'entrée en mots et compare chaque mot au keyword entier
    if (nkw.length >= 5) {
      const words = inp.split(/[\s,;\/]+/);
      const maxDist = nkw.length <= 6 ? 1 : 2;   // 1 faute ≤6 car., 2 fautes sinon
      if (words.some(w => w.length >= nkw.length - maxDist && levenshtein(w, nkw) <= maxDist)) {
        return true;
      }
    }

    return false;
  }

  function animateContent(el) {
    if (!el) return;
    el.classList.remove('visible');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
  }

  function clearChoices() {
    const el = dom.choices();
    if (el) el.innerHTML = '';
  }

  function scrollTop() {
    const sg = dom.scene();
    if (sg) sg.scrollTop = 0;
  }

  function getTagClass(val) {
    if (!val) return '';
    const map = { 'F-ND': 'tag-fnd', 'F-D': 'tag-fd', 'NF-D': 'tag-nfd', 'NF-ND': 'tag-nfnd' };
    return map[val] || '';
  }

  // ============================================================
  // DOSSIER PATIENT
  // ============================================================

  function showDossier() {
    const p = dom.dossierPanel();
    if (!p) return;
    document.body.classList.add('dossier-available');
    // Sur mobile, respecter le choix de l'utilisateur s'il a fermé manuellement
    if (window.innerWidth > 700 || !mobileUserClosed) {
      p.classList.add('visible');
      document.body.classList.add('dossier-open');
    }
  }

  function hideDossier() {
    const p = dom.dossierPanel();
    if (p) p.classList.remove('visible');
    document.body.classList.remove('dossier-available', 'dossier-open');
    mobileUserClosed = false;
  }

  function closeDossierMobile() {
    const p = dom.dossierPanel();
    if (p) p.classList.remove('visible');
    document.body.classList.remove('dossier-open');
    mobileUserClosed = true;
  }

  function openDossierMobile() {
    const p = dom.dossierPanel();
    if (p) p.classList.add('visible');
    document.body.classList.add('dossier-open');
    mobileUserClosed = false;
  }

  function addDossierField(field) {
    const container = dom.dossierFields();
    if (!container) return;
    if (container.querySelector(`[data-key="${field.key}"]`)) return;
    const div = document.createElement('div');
    div.className = `dossier-field ${field.importance}`;
    div.dataset.key = field.key;
    div.innerHTML = `<span class="df-label">${field.label}</span><span class="df-value">${field.value}</span>`;
    container.appendChild(div);
  }

  function addExamField(key, label, value) {
    const section   = dom.examSection();
    const container = dom.examFields();
    if (!section || !container) return;
    if (container.querySelector(`[data-key="${key}"]`)) return;
    section.style.display = 'block';
    const div = document.createElement('div');
    div.className = 'dossier-exam-field';
    div.dataset.key = key;
    // Coloriser les codes NF-D / F-D / F-ND / NF-ND dans la valeur
    const coloredValue = value.replace(/\b(NF-D|F-D|F-ND|NF-ND)\b/g, (m) => {
      const cls = getTagClass(m);
      return cls ? `<span class="${cls}">${m}</span>` : m;
    });
    div.innerHTML = `<div class="def-label">${label}</div><div class="def-value">${coloredValue}</div>`;
    container.appendChild(div);
  }

  function switchDossierToExam() {
    const titleEl = dom.dossierTitle();
    if (titleEl) titleEl.textContent = 'Fiche d\'Examen Clinique';
    const fields = dom.dossierFields();
    if (fields) {
      fields.style.maxHeight = '200px';
      fields.style.overflowY = 'auto';
      fields.style.fontSize  = '.78rem';
    }
  }

  // ============================================================
  // RENDU DES BLOCS STANDARD
  // ============================================================

  function renderBlock(block) {
    switch (block.type) {
      case 'title':
        return `<h1 class="main-title">${block.text}</h1>`;
      case 'subtitle':
        return `<p class="main-subtitle">${block.text}</p>`;
      case 'step-header':
        return `<div class="step-header">
          <span class="step-badge">Étape ${block.etape}</span>
          <h2 class="step-title">${block.text}</h2>
        </div>`;
      case 'test-header':
        return `<div class="test-header"><h3>${block.text}</h3></div>`;
      case 'recap-header':
        return `<div class="recap-header"><h3>📊 ${block.text}</h3></div>`;
      case 'narration':
        return `<p class="narration">${block.text}</p>`;
      case 'dialogue':
        return `<div class="dialogue-block">
          <div class="speaker-name">${block.speaker}</div>
          <div class="dialogue-text">${block.text}</div>
        </div>`;
      case 'feedback-success':
        return `<div class="feedback success"><span class="fb-icon">✓</span> ${block.text}</div>`;
      case 'feedback-error':
        return `<div class="feedback error"><span class="fb-icon">!</span> ${block.text}</div>`;
      case 'info-block':
        return `<div class="info-block"><strong>${block.label} :</strong> ${block.text}</div>`;
      case 'legend':
        return `<div class="legend-grid">${block.items.map(i =>
          `<div class="legend-item">
            <span class="legend-code ${i.code.replace('-','').toLowerCase()}">${i.code}</span>
            <span class="legend-label">${i.label}</span>
          </div>`).join('')}</div>`;
      case 'list':
        return `<ul class="content-list">${block.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      case 'findings':
        return `<div class="findings-grid">${block.items.map(f =>
          `<div class="finding-row">
            <span class="finding-label">${f.label}</span>
            <span class="finding-value">${f.text}</span>
          </div>`).join('')}</div>`;
      case 'image':
        return `<div class="media-block">
          <img src="${block.src}" alt="${block.alt}"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="media-placeholder" style="display:none;">
            <span class="ph-icon">🖼</span><span>${block.placeholder}</span>
          </div>
        </div>`;
      case 'video':
        return `<div class="media-block">
          <video controls preload="metadata" style="width:100%;border-radius:8px;">
            <source src="${block.src}" type="video/mp4">
          </video>
          <div class="media-placeholder video-ph">
            <span class="ph-icon">🎬</span><span>${block.placeholder}</span>
          </div>
        </div>`;
      case 'recap-table':
        return `<table class="data-table">
          <thead><tr><th>Mouvement</th><th>Qualification</th></tr></thead>
          <tbody>${block.rows.map(r =>
            `<tr><td>${r.label}</td>
            <td><span class="tag ${getTagClass(state[r.stateKey])}">${state[r.stateKey] || '—'}</span></td>
            </tr>`).join('')}</tbody></table>`;
      case 'compare-table':
        return `<table class="data-table">
          <thead><tr><th>Mouvement</th><th>Actif</th><th>Passif</th></tr></thead>
          <tbody>${block.rows.map(r =>
            `<tr><td>${r.label}</td>
            <td><span class="tag ${getTagClass(state[r.actifKey])}">${state[r.actifKey] || '—'}</span></td>
            <td><span class="tag ${getTagClass(state[r.passifKey])}">${state[r.passifKey] || '—'}</span></td>
            </tr>`).join('')}</tbody></table>`;
      case 'diagnostic-block':
        return `<div class="diagnostic-block">
          <h4>${block.title}</h4>
          <ul>${block.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`;
      case 'recap-final':
        return renderRecapFinal();
      case 'full-recap':
        return renderFullRecap();
      default:
        return '';
    }
  }

  // ============================================================
  // RENDER PRINCIPAL — dispatch selon type
  // ============================================================

  function render(stepId) {
    const step = SCENARIOS[stepId];
    if (!step) { console.error('Step non trouvé:', stepId); return; }

    if (step.onEnter) step.onEnter(state);
    setScene(step.scene || 'cabinet');

    // Dispatch
    switch (step.type) {
      case 'interrogatoire':
        interrogatoire.active = true;
        renderInterrogatoire(step);
        break;
      case 'bilan-anamnese':
        renderBilanAnamnese(step);
        break;
      case 'bilan-decisionnel':
        renderBilanDecisionnel(step);
        break;
      case 'vignette-recap':
        renderVignetteRecap(step);
        break;
      case 'choix-argumente':
        renderChoixArgumente(step);
        break;
      case 'choix-libre':
        renderChoixLibre(step);
        break;
      case 'observation-libre':
        renderObservationLibre(step);
        break;
      case 'examen-libre':
        renderExamenLibre(step);
        break;
      case 'cerveau-branche':
        renderCerveauBranche(step);
        break;
      case 'conclusion':
        renderStandard(step, stepId);
        // SCORM : rapport de score et de complétion à la fin du parcours
        {
          const scorePct = totalChoices
            ? Math.round(((totalChoices - errors) / totalChoices) * 100)
            : 100;
          SCORM.reportCompletion(scorePct, 70); // masteryscore = 70
        }
        break;
      case 'recap':
        renderStandard(step, stepId);
        break;
      default:
        // intro, step, error, choix-initial
        renderStandard(step, stepId);
    }

    // Dossier visible sur les étapes examen
    if (shouldShowDossier(stepId)) {
      showDossier();
    }

    updateProgress(stepId);
    scrollTop();
  }

  function shouldShowDossier(stepId) {
    const examIds = [
      'Localisation', 'LocalisationCervicale', 'LocalisationErreur',
      'RythmeArguments', 'RythmeErreur', 'RythmeMixte',
      'TypeDouleurArguments', 'TypeNociceptif', 'TypeErreurNeuropathique', 'TypeErreurNociplastique',
      'FeuArguments', 'FeuVert', 'FeuRouge', 'BilanDecisionnel',
      'ExamenClinique_Entree', 'Observation',
      'AmplitudesActives', 'TestsExamen',
      'RaisonnementPassives', 'RaisonnementPassives_Erreur',
      'AmplitudesPassives', 'OnBrancleLeCerveau', 'Transition_Palpation',
      'PalpationDynamique', 'PalpationDynamique_Correct', 'PalpationDynamique_Erreur',
      'PalpationStatique', 'MouvementsRepetes',
      'PreferenceDirectionnelle_Oui', 'PreferenceDirectionnelle_Non',
      'PriseEnCharge'
    ];
    return examIds.includes(stepId);
  }

  // ============================================================
  // RENDER STANDARD (intro, step, error, choix-initial, conclusion, recap)
  // ============================================================

  function renderStandard(step, stepId) {
    const contentEl = dom.content();
    contentEl.innerHTML = step.content ? step.content.map(renderBlock).join('') : '';
    animateContent(contentEl);

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';

    if (step.choices && step.choices.length > 0) {
      if (step.question) {
        const qEl = document.createElement('p');
        qEl.className = 'question-text';
        qEl.innerHTML = step.question;
        choicesEl.appendChild(qEl);
      }
      step.choices.forEach(choice => {
        if (choice.action === 'downloadPDF') {
          const btn = document.createElement('button');
          btn.className = 'choice-btn pdf-btn';
          btn.innerHTML = choice.text;
          btn.addEventListener('click', generatePDF);
          choicesEl.appendChild(btn);
        } else {
          const btn = document.createElement('button');
          btn.className = 'choice-btn';
          btn.innerHTML = choice.text;
          btn.addEventListener('click', () => handleChoice(choice, step));
          choicesEl.appendChild(btn);
        }
      });
    } else if (step.next) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn continue';
      btn.textContent = 'Continuer →';
      btn.addEventListener('click', () => navigate(step.next));
      choicesEl.appendChild(btn);
    }
  }

  // ============================================================
  // INTERROGATOIRE LIBRE
  // ============================================================

  function renderInterrogatoire(step) {
    showDossier();
    const contentEl = dom.content();
    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Étape 1</span>
        <h2 class="step-title">Anamnèse</h2>
      </div>
      <div class="interrogatoire-intro">${step.intro}</div>
      <div class="chat-history" id="chat-history"></div>
    `;

    // Rejouer le log
    if (interrogatoire.chatLog.length > 0) {
      const hist = document.getElementById('chat-history');
      interrogatoire.chatLog.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-msg ${m.role}`;
        div.innerHTML = `<span class="chat-label">${m.role === 'praticien' ? 'Vous' : 'Monsieur F'}</span>
          <div class="chat-bubble">${m.text}</div>`;
        hist.appendChild(div);
      });
      hist.scrollTop = hist.scrollHeight;
    }

    const choicesEl = dom.choices();
    choicesEl.innerHTML = `
      <p class="input-hint">Tapez votre question comme vous la poseriez au patient…</p>
      <div class="interrogatoire-input-wrap">
        <textarea class="interrogatoire-input" id="question-input"
          placeholder="Ex : Depuis combien de temps avez-vous ces douleurs ?"
          rows="1"></textarea>
        <button class="btn-ask" id="btn-ask">Envoyer</button>
      </div>
      <button class="btn-end-anamnese" id="btn-end-anamnese">Terminer l'anamnèse →</button>
    `;

    const textarea = document.getElementById('question-input');
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    });
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }
    });
    document.getElementById('btn-ask').addEventListener('click', sendQuestion);
    document.getElementById('btn-end-anamnese').addEventListener('click', () => {
      interrogatoire.active = false;
      navigate(step.next);
    });

    animateContent(contentEl);
  }

  function sendQuestion() {
    const input = document.getElementById('question-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    handleQuestion(val);
    input.value = '';
    input.style.height = 'auto';
    input.focus();
  }

  function addChatMessage(role, text, histId = 'chat-history') {
    const entry = { role, text };
    if (histId === 'chat-history') interrogatoire.chatLog.push(entry);
    const hist = document.getElementById(histId);
    if (!hist) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    const label = role === 'praticien' ? 'Vous' : 'Monsieur F';
    div.innerHTML = `<span class="chat-label">${label}</span><div class="chat-bubble">${text}</div>`;
    hist.appendChild(div);
    hist.scrollTop = hist.scrollHeight;
  }

  function handleQuestion(input) {
    const step = SCENARIOS['Anamnese'];
    const trimmed = input.trim();
    if (!trimmed) return;

    addChatMessage('praticien', trimmed);

    const topicKey = matchTopicAnamnese(trimmed, step.topics);

    if (!topicKey) {
      const reply = step.offTopic[interrogatoire.offTopicIndex % step.offTopic.length];
      interrogatoire.offTopicIndex++;
      setTimeout(() => addChatMessage('patient', reply), 300);
      return;
    }

    if (topicKey === 'question_large') {
      if (interrogatoire.askedTopics.has('question_large')) {
        setTimeout(() => addChatMessage('patient', step.doublon), 300);
        return;
      }
      interrogatoire.askedTopics.add('question_large');
      const topic = step.topics['question_large'];
      const keyMap = { 'localisation_douleur': 'localisation', 'duree': 'duree', 'contexte_pro': 'travail' };
      topic.multiFields.forEach(f => {
        interrogatoire.askedTopics.add(keyMap[f.key] || f.key);
      });
      setTimeout(() => {
        topic.multiFields.forEach(f => addDossierField(f));
        addChatMessage('patient', topic.reponse);
      }, 300);
      return;
    }

    if (interrogatoire.askedTopics.has(topicKey)) {
      setTimeout(() => addChatMessage('patient', step.doublon), 300);
      return;
    }

    interrogatoire.askedTopics.add(topicKey);
    const topic = step.topics[topicKey];
    setTimeout(() => {
      addChatMessage('patient', topic.reponse);
      addDossierField(topic.field);
    }, 300);
  }

  function matchTopicAnamnese(input, topics) {
    const inp = normalize(input);
    for (const [key, topic] of Object.entries(topics)) {
      for (const kw of topic.keywords) {
        if (matchKeyword(kw, inp)) return key;
      }
    }
    return null;
  }

  // ============================================================
  // BILAN ANAMNÈSE
  // ============================================================

  function renderBilanAnamnese(step) {
    const scenario  = SCENARIOS['Anamnese'];
    const allTopics = scenario.topics;
    const asked     = interrogatoire.askedTopics;

    const realTopics  = Object.keys(allTopics).filter(k => k !== 'question_large');
    const totalTopics = realTopics.length;
    const totalAsked  = realTopics.filter(k => asked.has(k)).length;
    const pct         = Math.round((totalAsked / totalTopics) * 100);
    const circleClass = pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'low';

    const items = ALL_TOPICS_ORDER.filter(k => allTopics[k]).map(k => {
      const topic = allTopics[k];
      const done  = asked.has(k);
      const imp   = topic.field.importance;
      const css   = done ? 'ok' : imp;
      const icon  = done ? '✓' : (imp === 'required' ? '✗' : imp === 'important' ? '!' : '○');
      return `<div class="bilan-item ${css}">
        <span class="bi-icon">${icon}</span>
        <span class="bi-label">${topic.field.label}</span>
      </div>`;
    }).join('');

    let msg = '';
    if (pct >= 80) msg = 'Excellente anamnèse — vous avez recueilli l\'essentiel des informations.';
    else if (pct >= 50) msg = 'Anamnèse correcte — quelques informations importantes manquent.';
    else msg = 'Anamnèse incomplète — plusieurs éléments clés n\'ont pas été recueillis.';

    const contentEl = dom.content();
    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Bilan</span>
        <h2 class="step-title">Bilan de l'anamnèse</h2>
      </div>
      <div class="bilan-anamnese">
        <div class="bilan-score-row">
          <div class="bilan-score-circle ${circleClass}">
            <span class="bsc-num">${totalAsked}</span>
            <span class="bsc-denom">/ ${totalTopics}</span>
          </div>
          <p class="bilan-score-text">${msg}</p>
        </div>
        <div class="bilan-grid">${items}</div>
      </div>`;
    animateContent(contentEl);

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'choice-btn continue';
    btn.textContent = 'Voir la synthèse clinique →';
    btn.addEventListener('click', () => navigate(step.next));
    choicesEl.appendChild(btn);

    state.bilanAnamnese = { totalAsked, totalTopics, pct };
  }

  // ============================================================
  // FICHE RÉCAP CLINIQUE (vignette-recap)
  // ============================================================

  function renderVignetteRecap(step) {
    const sectionsHtml = step.sections.map(section => {
      const highlightClass = section.highlight ? 'vignette-section highlight' : 'vignette-section';
      return `<div class="${highlightClass}">
        <div class="vignette-section-title">${section.titre}</div>
        <ul>${section.items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`;
    }).join('');

    const contentEl = dom.content();
    contentEl.innerHTML = `
      <div class="vignette-card">
        <div class="vignette-header">
          <span class="vignette-icon">📋</span>
          <div>
            <div class="vignette-name">${step.title}</div>
            <div class="vignette-sub">${step.subtitle}</div>
          </div>
        </div>
        <div class="vignette-sections">${sectionsHtml}</div>
      </div>`;
    animateContent(contentEl);

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'choice-btn continue';
    btn.textContent = 'Commencer l\'examen →';
    btn.addEventListener('click', () => {
      switchDossierToExam();
      navigate(step.next);
    });
    choicesEl.appendChild(btn);
    showDossier();
  }

  // ============================================================
  // BILAN DÉCISIONNEL (bilan-decisionnel)
  // ============================================================

  function renderBilanDecisionnel(step) {
    const rythmeOk = state.rythme === 'mixte';
    const typeOk   = !!state.type_douleur;
    const feuOk    = state.feu === 'vert';

    const contentEl = dom.content();
    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Bilan</span>
        <h2 class="step-title">Synthèse du raisonnement</h2>
      </div>
      <div class="bilan-decisionnel">
        <div class="bd-row ${rythmeOk ? 'ok' : 'error'}">
          <span class="bd-icon">${rythmeOk ? '✓' : '!'}</span>
          <span class="bd-label">Rythme</span>
          <span class="bd-value">${state.rythme || '—'}</span>
        </div>
        <div class="bd-row ${typeOk ? 'ok' : 'error'}">
          <span class="bd-icon">${typeOk ? '✓' : '!'}</span>
          <span class="bd-label">Type douloureux</span>
          <span class="bd-value">${state.type_douleur ? 'Nociceptif mécanique (composante radiculaire possible)' : '—'}</span>
        </div>
        <div class="bd-row ${feuOk ? 'ok feu-vert' : 'error feu-rouge'}">
          <span class="bd-icon">${feuOk ? '🟢' : '🔴'}</span>
          <span class="bd-label">Feu décisionnel</span>
          <span class="bd-value">${state.feu === 'vert' ? 'Feu vert — Prise en charge indiquée' : state.feu || '—'}</span>
        </div>
      </div>
      <p class="narration">Monsieur F est prêt pour l'examen clinique.</p>`;
    animateContent(contentEl);

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'choice-btn continue';
    btn.textContent = 'Commencer l\'examen clinique →';
    btn.addEventListener('click', () => navigate(step.next));
    choicesEl.appendChild(btn);
  }

  // ============================================================
  // CHOIX ARGUMENTÉ (rythme / type / feu)
  // ============================================================

  function renderChoixArgumente(step) {
    const contentEl = dom.content();
    if (!argumentsCoches[step.titre]) argumentsCoches[step.titre] = new Set();

    const argsHtml = step.arguments.map(arg => `
      <label class="argument-label" data-id="${arg.id}">
        <input type="checkbox" class="argument-cb" value="${arg.id}">
        <span>${arg.texte}</span>
      </label>`).join('');

    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Analyse</span>
        <h2 class="step-title">${step.titre}</h2>
      </div>
      <p class="narration">${step.instructions}</p>
      <div class="arguments-grid" id="arguments-grid">${argsHtml}</div>`;
    animateContent(contentEl);

    // Restaurer les coches si on revient
    argumentsCoches[step.titre].forEach(id => {
      const cb = contentEl.querySelector(`input[value="${id}"]`);
      if (cb) cb.checked = true;
    });

    contentEl.querySelectorAll('.argument-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) argumentsCoches[step.titre].add(cb.value);
        else argumentsCoches[step.titre].delete(cb.value);
      });
    });

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    if (step.question) {
      const qEl = document.createElement('p');
      qEl.className = 'question-text';
      qEl.innerHTML = step.question;
      choicesEl.appendChild(qEl);
    }
    step.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = choice.text;
      btn.addEventListener('click', () => handleChoice(choice, step));
      choicesEl.appendChild(btn);
    });
  }

  // ============================================================
  // CHOIX LIBRE (saisie libre → keyword match → navigation)
  // ============================================================

  function renderChoixLibre(step) {
    const contentEl = dom.content();
    const blocksHtml = step.content ? step.content.map(renderBlock).join('') : '';
    contentEl.innerHTML = `
      ${step.titre ? `<div class="step-header"><span class="step-badge">Étape ${step.etape || ''}</span><h2 class="step-title">${step.titre}</h2></div>` : ''}
      ${blocksHtml}
      <div class="chat-history" id="chat-history-libre"></div>`;
    animateContent(contentEl);

    const choicesEl = dom.choices();
    choicesEl.innerHTML = `
      <p class="input-hint">${step.hint || 'Que souhaitez-vous faire ?'}</p>
      <div class="interrogatoire-input-wrap">
        <textarea class="interrogatoire-input" id="libre-input"
          placeholder="${step.placeholder || ''}" rows="1"></textarea>
        <button class="btn-ask" id="btn-libre-send">Envoyer</button>
      </div>`;

    const textarea = document.getElementById('libre-input');

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    });
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChoixLibre(step); }
    });
    document.getElementById('btn-libre-send').addEventListener('click', () => sendChoixLibre(step));
  }

  function sendChoixLibre(step) {
    const input = document.getElementById('libre-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const hist = document.getElementById('chat-history-libre');
    if (hist) {
      const div = document.createElement('div');
      div.className = 'chat-msg praticien';
      div.innerHTML = `<span class="chat-label">Vous</span><div class="chat-bubble">${val}</div>`;
      hist.appendChild(div);
      hist.scrollTop = hist.scrollHeight;
    }

    input.value = '';
    input.style.height = 'auto';

    const inp = normalize(val);
    let matched = null;
    if (step.optionsAttendues) {
      for (const opt of step.optionsAttendues) {
        if (opt.keywords.some(kw => matchKeyword(kw, inp))) {
          matched = opt;
          break;
        }
      }
    }

    setTimeout(() => {
      if (matched) {
        if (matched.correct) {
          navigate(matched.next);
        } else {
          // Feedback + on continue quand même
          if (hist) {
            const div = document.createElement('div');
            div.className = 'chat-msg feedback-inline error';
            div.innerHTML = `<div class="chat-bubble">${step.feedbackParDefaut}</div>`;
            hist.appendChild(div);
            hist.scrollTop = hist.scrollHeight;
          }
          setTimeout(() => navigate(matched.next || step.fallbackNext), 1200);
        }
      } else {
        // Vérifier feedback spécifiques
        let feedbackText = step.feedbackParDefaut;
        if (step.feedbackSiErreursFrequentes) {
          for (const [kw, fb] of Object.entries(step.feedbackSiErreursFrequentes)) {
            if (matchKeyword(kw, inp)) { feedbackText = fb; break; }
          }
        }
        if (hist) {
          const div = document.createElement('div');
          div.className = 'chat-msg feedback-inline error';
          div.innerHTML = `<div class="chat-bubble">${feedbackText}</div>`;
          hist.appendChild(div);
          hist.scrollTop = hist.scrollHeight;
        }
        // Auto-continuer après délai
        setTimeout(() => navigate(step.fallbackNext), 2000);
      }
    }, 300);
  }

  // ============================================================
  // OBSERVATION LIBRE
  // ============================================================

  function renderObservationLibre(step) {
    showDossier();
    const contentEl = dom.content();

    const imagesHtml = step.images.map(img => `
      <div class="media-block obs-photo">
        <img src="${img.src}" alt="${img.alt}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="media-placeholder" style="display:none;">
          <span class="ph-icon">🖼</span><span>${img.placeholder}</span>
        </div>
      </div>`).join('');

    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Étape 5</span>
        <h2 class="step-title">Observation</h2>
      </div>
      <p class="narration">${step.intro}</p>
      <div class="obs-photos-grid">${imagesHtml}</div>
      <div class="chat-history" id="obs-chat"></div>`;
    animateContent(contentEl);

    // Restaurer le chat si on revient
    if (observationState.chatLog.length > 0) {
      const hist = document.getElementById('obs-chat');
      observationState.chatLog.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-msg ${m.role}`;
        const lbl = m.role === 'praticien' ? 'Vous' : 'Monsieur F';
        div.innerHTML = `<span class="chat-label">${lbl}</span><div class="chat-bubble">${m.text}</div>`;
        hist.appendChild(div);
      });
    }

    renderObsInputZone(step);
  }

  function renderObsInputZone(step) {
    const choicesEl = dom.choices();
    const mouvFait  = observationState.mouvementOpposeDemandeé;

    choicesEl.innerHTML = `
      <p class="input-hint">${step.inputLabel}</p>
      <div class="interrogatoire-input-wrap">
        <textarea class="interrogatoire-input" id="obs-input"
          placeholder="${step.inputHint}" rows="1"></textarea>
        <button class="btn-ask" id="btn-obs-send">Envoyer</button>
      </div>
      <button class="btn-end-anamnese" id="btn-obs-next">
        Passer à l'étape suivante →
      </button>`;

    const textarea = document.getElementById('obs-input');
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    });
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendObservation(step); }
    });
    document.getElementById('btn-obs-send').addEventListener('click', () => sendObservation(step));
    document.getElementById('btn-obs-next').addEventListener('click', () => {
      if (observationState.antalgiqueMentionne && !observationState.mouvementOpposeDemandeé) {
        showObsWarning(step);
      } else {
        navigate(step.next);
      }
    });
  }

  function sendObservation(step) {
    const input = document.getElementById('obs-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const hist = document.getElementById('obs-chat');
    const addMsg = (role, text) => {
      observationState.chatLog.push({ role, text });
      if (hist) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        const lbl = role === 'praticien' ? 'Vous' : 'Monsieur F';
        div.innerHTML = `<span class="chat-label">${lbl}</span><div class="chat-bubble">${text}</div>`;
        hist.appendChild(div);
        hist.scrollTop = hist.scrollHeight;
      }
    };

    addMsg('praticien', val);
    input.value = '';
    input.style.height = 'auto';

    const inp = normalize(val);

    // Phase 1 : détecter si une description de position antalgique est donnée
    if (!observationState.descriptionDonnee) {
      observationState.descriptionDonnee = true;
      const antalgique = step.motsClésAntalgique.some(kw => matchKeyword(kw, inp));
      if (antalgique) {
        observationState.antalgiqueMentionne = true;
        setTimeout(() => {
          addMsg('patient', 'Oui, c\'est une position qui me soulage un peu… j\'ai tendance à me tenir comme ça naturellement.');
          // Invite à tester le mouvement opposé
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'feedback info inline-feedback';
            div.innerHTML = `💡 Vous avez identifié une position antalgique. Demandez au patient de réaliser le mouvement opposé pour la confirmer.`;
            const hist2 = document.getElementById('obs-chat');
            if (hist2) { hist2.appendChild(div); hist2.scrollTop = hist2.scrollHeight; }
          }, 500);
        }, 300);
      } else {
        setTimeout(() => addMsg('patient', 'Je ne suis pas sûr de bien vous suivre, docteur…'), 300);
      }
      return;
    }

    // Phase 2 : détecter demande du mouvement opposé
    const mouvOpp = step.mouvementOppose;
    if (!observationState.mouvementOpposeDemandeé &&
        mouvOpp.keywords.some(kw => matchKeyword(kw, inp))) {
      observationState.mouvementOpposeDemandeé = true;
      setTimeout(() => {
        addMsg('patient', mouvOpp.dialogue);
        state.observation = mouvOpp.dossierValue;
        addExamField('observation', 'Observation posturale', mouvOpp.dossierValue);
        const div = document.createElement('div');
        div.className = 'feedback success inline-feedback';
        div.innerHTML = `✓ Confirmation du mouvement opposé — Fiche patient mise à jour.`;
        const hist2 = document.getElementById('obs-chat');
        if (hist2) { hist2.appendChild(div); hist2.scrollTop = hist2.scrollHeight; }
      }, 300);
      return;
    }

    // Tout autre message
    setTimeout(() => addMsg('patient', 'Je ne sais pas trop ce que vous cherchez à voir là, docteur.'), 300);
  }

  function showObsWarning(step) {
    const choicesEl = dom.choices();
    // Insérer avertissement au-dessus des boutons existants
    const warning = document.createElement('div');
    warning.className = 'feedback warning obs-warning';
    warning.innerHTML = `⚠️ ${step.avertissementMouvementOppose}`;
    choicesEl.insertBefore(warning, choicesEl.firstChild);
    // Continuer quand même après 2s ou via bouton déjà présent
    setTimeout(() => {
      state.observation = step.resultatsObservation.normal;
      addExamField('observation', 'Observation posturale', step.resultatsObservation.normal);
      navigate(step.next);
    }, 3000);
  }

  // ============================================================
  // EXAMEN LIBRE (amplitudes actives, tests, amplitudes passives)
  // ============================================================

  function renderExamenLibre(step) {
    showDossier();
    const phase = step.phase;
    if (!examenLibreState[phase]) {
      examenLibreState[phase] = { done: new Set(), chatLog: [] };
    }
    const phState = examenLibreState[phase];

    const contentEl = dom.content();
    const legendeHtml = step.legendeQualification ? `
      <div class="legend-grid">
        <div class="legend-item"><span class="legend-code nfd">NF-D</span><span class="legend-label">Non Fonctionnel et Douloureux</span></div>
        <div class="legend-item"><span class="legend-code fd">F-D</span><span class="legend-label">Fonctionnel et Douloureux</span></div>
        <div class="legend-item"><span class="legend-code nfnd">NF-ND</span><span class="legend-label">Non Fonctionnel et Non Douloureux</span></div>
        <div class="legend-item"><span class="legend-code fnd">F-ND</span><span class="legend-label">Fonctionnel et Non Douloureux</span></div>
      </div>` : '';

    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Étape ${step.etape}</span>
        <h2 class="step-title">${step.label}</h2>
      </div>
      <p class="narration">${step.intro}</p>
      ${legendeHtml}
      <div class="chat-history examen-chat" id="examen-chat"></div>`;
    animateContent(contentEl);

    // Restaurer le chat
    const hist = document.getElementById('examen-chat');
    phState.chatLog.forEach(m => {
      const div = document.createElement('div');
      div.className = `chat-msg ${m.role}`;
      const lbl = m.role === 'praticien' ? 'Vous' : 'Monsieur F';
      div.innerHTML = `<span class="chat-label">${lbl}</span><div class="chat-bubble">${m.text}</div>`;
      hist.appendChild(div);
    });

    renderExamenInputZone(step, phState);
  }

  function renderExamenInputZone(step, phState) {
    const choicesEl = dom.choices();
    choicesEl.innerHTML = `
      <p class="input-hint">${step.hint}</p>
      <div class="interrogatoire-input-wrap">
        <textarea class="interrogatoire-input" id="examen-input"
          placeholder="${step.hint}" rows="1"></textarea>
        <button class="btn-ask" id="btn-examen-send">Envoyer</button>
      </div>
      <button class="btn-end-anamnese" id="btn-examen-next">
        Passer à l'étape suivante →
      </button>`;

    const textarea = document.getElementById('examen-input');
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    });
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendExamen(step, phState); }
    });
    document.getElementById('btn-examen-send').addEventListener('click', () => sendExamen(step, phState));
    document.getElementById('btn-examen-next').addEventListener('click', () => checkAndNavigateExamen(step, phState));
  }

  function sendExamen(step, phState) {
    const input = document.getElementById('examen-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const hist = document.getElementById('examen-chat');
    const addMsg = (role, text) => {
      phState.chatLog.push({ role, text });
      if (hist) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        const lbl = role === 'praticien' ? 'Vous' : 'Monsieur F';
        div.innerHTML = `<span class="chat-label">${lbl}</span><div class="chat-bubble">${text}</div>`;
        hist.appendChild(div);
        hist.scrollTop = hist.scrollHeight;
      }
    };

    addMsg('praticien', val);
    input.value = '';
    input.style.height = 'auto';

    const inp = normalize(val);

    // Matcher tous les mouvements / tests dans la saisie
    const matches = [];
    for (const [key, entry] of Object.entries(step.pool)) {
      if (phState.done.has(key)) continue;
      if (entry.keywords.some(kw => matchKeyword(kw, inp))) {
        matches.push({ key, entry });
      }
    }

    if (matches.length === 0) {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'feedback warning inline-feedback';
        div.innerHTML = `Je ne reconnais pas ce test ou mouvement. Reformulez votre demande.`;
        if (hist) { hist.appendChild(div); hist.scrollTop = hist.scrollHeight; }
      }, 300);
      return;
    }

    // Traiter chaque match avec un délai pour simuler la séquence
    matches.forEach((m, i) => {
      setTimeout(() => processExamenEntry(m.key, m.entry, step, phState, hist, addMsg), 400 * (i + 1));
    });
  }

  function processExamenEntry(key, entry, step, phState, hist, addMsg) {
    // Cas non indiqué (passives F-ND)
    if (entry.nonIndique) {
      const div = document.createElement('div');
      div.className = 'feedback warning inline-feedback';
      div.innerHTML = `⚠️ ${entry.feedbackNonIndique}`;
      if (hist) { hist.appendChild(div); hist.scrollTop = hist.scrollHeight; }
      return;
    }

    phState.done.add(key);

    // Afficher la vidéo ou l'image inline dans le chat
    if (entry.video || entry.image) {
      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'chat-media';
      if (entry.video) {
        mediaDiv.innerHTML = `
          <div class="media-block compact">
            <video controls preload="metadata" style="width:100%;border-radius:6px;">
              <source src="${entry.video.src}" type="video/mp4">
            </video>
            <div class="media-placeholder video-ph">
              <span class="ph-icon">🎬</span><span>${entry.video.placeholder}</span>
            </div>
          </div>`;
      } else if (entry.image) {
        mediaDiv.innerHTML = `
          <div class="media-block compact">
            <img src="${entry.image.src}" alt="${entry.image.alt}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="media-placeholder" style="display:none;">
              <span class="ph-icon">🖼</span><span>${entry.image.placeholder}</span>
            </div>
          </div>`;
      }
      if (hist) { hist.appendChild(mediaDiv); hist.scrollTop = hist.scrollHeight; }
    }

    // Dialogues patient
    if (entry.dialogues) {
      entry.dialogues.forEach((d, di) => {
        setTimeout(() => addMsg('patient', d), 150 * (di + 1));
      });
    }

    // Résultat inline
    if (entry.resultat) {
      setTimeout(() => {
        const tag  = getTagClass(entry.resultat);
        const resTxt = entry.interpretation
          ? `${entry.label} : <span class="tag ${tag}">${entry.resultat}</span> — ${entry.interpretation}`
          : `${entry.label} : <span class="tag ${tag}">${entry.resultat}</span>`;
        const div = document.createElement('div');
        div.className = 'feedback success inline-feedback';
        div.innerHTML = `✓ ${resTxt}`;
        if (hist) { hist.appendChild(div); hist.scrollTop = hist.scrollHeight; }
      }, 150 * (entry.dialogues ? entry.dialogues.length + 1 : 1));

      // Mettre à jour l'état et le dossier
      if (entry.stateKey) state[entry.stateKey] = entry.resultat;
      if (entry.dossierValue) {
        addExamField(entry.stateKey || key, entry.label, entry.dossierValue);
      }
    }
  }

  function checkAndNavigateExamen(step, phState) {
    const oublies = (step.obligatoires || []).filter(k => !phState.done.has(k));
    const importantsMissing = (step.importants || []).filter(k => !phState.done.has(k));

    if (oublies.length > 0 || importantsMissing.length > 0) {
      showExamenOubliWarning(step, phState, oublies, importantsMissing);
    } else {
      navigate(step.next);
    }
  }

  function showExamenOubliWarning(step, phState, oublies, importants) {
    const choicesEl = dom.choices();
    // Retirer l'avertissement précédent s'il existe
    const prev = choicesEl.querySelector('.oubli-warning');
    if (prev) prev.remove();

    const warning = document.createElement('div');
    warning.className = 'feedback warning oubli-warning';

    let html = '';
    if (oublies.length > 0) {
      const labels = oublies.map(k => `<strong>${step.pool[k]?.label || k}</strong>`).join(', ');
      html += `<p>⚠️ ${step.messageAvertissementOublis} ${labels}</p>`;
    }
    if (importants.length > 0) {
      const labels = importants.map(k => `<strong>${step.pool[k]?.label || k}</strong>`).join(', ');
      html += `<p>💡 ${step.messageAvertissementImportants || 'Il serait conseillé de tester :'} ${labels}</p>`;
    }
    html += `<p style="margin-top:8px;font-size:.85rem">Vous pouvez continuer malgré tout ou compléter les tests manquants.</p>`;

    warning.innerHTML = html;
    choicesEl.insertBefore(warning, choicesEl.firstChild);

    // Ajouter bouton "Continuer quand même"
    const btnForce = document.createElement('button');
    btnForce.className = 'choice-btn continue';
    btnForce.textContent = 'Continuer quand même →';
    btnForce.style.marginTop = '8px';
    btnForce.addEventListener('click', () => navigate(step.next));
    choicesEl.appendChild(btnForce);
  }

  // ============================================================
  // ON BRANCHE LE CERVEAU (cerveau-branche)
  // ============================================================

  function renderCerveauBranche(step) {
    showDossier();

    const contentEl = dom.content();
    const mouvementsHtml = step.mouvements.map(mouv => `
      <div class="cerveau-card" data-mouv="${mouv.id}">
        <div class="cerveau-card-header">
          <span class="cerveau-mouv-label">${mouv.label}</span>
          <span class="cerveau-mouv-desc">${mouv.description}</span>
        </div>
        <div class="cerveau-options">
          ${step.options.map(opt => `
            <label class="cerveau-opt-label">
              <input type="checkbox" class="cerveau-cb" data-mouv="${mouv.id}" value="${opt.id}">
              <span>${opt.label}</span>
            </label>`).join('')}
        </div>
        <div class="cerveau-conduite">
          <p class="cerveau-conduite-question">${step.questionConduite}</p>
          ${step.choixConduite.map(c => `
            <label class="cerveau-radio-label">
              <input type="radio" name="conduite-${mouv.id}" class="cerveau-radio" value="${c.id}">
              <span>${c.label}</span>
            </label>`).join('')}
        </div>
        <div class="cerveau-feedback" id="fb-${mouv.id}" style="display:none;"></div>
      </div>`).join('');

    contentEl.innerHTML = `
      <div class="step-header">
        <span class="step-badge">Étape 9</span>
        <h2 class="step-title">On branche le cerveau !</h2>
      </div>
      <p class="narration">${step.intro}</p>
      <p class="narration" style="font-size:.9rem">${step.instructions}</p>
      <div class="cerveau-grid" id="cerveau-grid">${mouvementsHtml}</div>`;
    animateContent(contentEl);

    // Restaurer les sélections précédentes
    if (cerveauState && Object.keys(cerveauState).length > 0) {
      step.mouvements.forEach(mouv => {
        const saved = cerveauState[mouv.id];
        if (!saved) return;
        saved.options && saved.options.forEach(optId => {
          const cb = contentEl.querySelector(`input[data-mouv="${mouv.id}"][value="${optId}"]`);
          if (cb) cb.checked = true;
        });
        if (saved.conduite) {
          const rb = contentEl.querySelector(`input[name="conduite-${mouv.id}"][value="${saved.conduite}"]`);
          if (rb) rb.checked = true;
        }
      });
    }

    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    const btnValider = document.createElement('button');
    btnValider.className = 'choice-btn';
    btnValider.textContent = 'Valider mes réponses →';
    btnValider.addEventListener('click', () => validerCerveau(step));
    choicesEl.appendChild(btnValider);
  }

  function validerCerveau(step) {
    cerveauState = {};
    let allOk = true;

    step.mouvements.forEach(mouv => {
      const cbs = document.querySelectorAll(`.cerveau-cb[data-mouv="${mouv.id}"]:checked`);
      const selectedOptions = Array.from(cbs).map(cb => cb.value);
      const conduiteEl = document.querySelector(`input[name="conduite-${mouv.id}"]:checked`);
      const conduite = conduiteEl ? conduiteEl.value : null;

      cerveauState[mouv.id] = { options: selectedOptions, conduite };

      const fbEl = document.getElementById(`fb-${mouv.id}`);
      if (!fbEl) return;

      const fb = evaluerCerveau(selectedOptions, conduite, step.regles);
      fbEl.style.display = 'block';
      fbEl.className = `cerveau-feedback feedback ${fb.type}`;
      fbEl.innerHTML = fb.texte;
      if (fb.type !== 'success') allOk = false;
    });

    // Sauvegarder dans l'état
    state.cerveauBranche = cerveauState;

    // Bouton continuer
    const choicesEl = dom.choices();
    choicesEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'choice-btn continue';
    btn.textContent = 'Continuer →';
    btn.addEventListener('click', () => navigate(step.next));
    choicesEl.appendChild(btn);
  }

  function evaluerCerveau(selectedOptions, conduite, regles) {
    const has = id => selectedOptions.includes(id);

    // Pas de dysfonction
    if (has('pas_de_dysfonction')) {
      return { type: 'error', texte: regles.feedbacks.pas_de_dysfonction.texte };
    }

    // Contrôle moteur coché
    if (has('controle_moteur')) {
      const fb = regles.feedbacks.controle_moteur;
      if (conduite === 'arreter') {
        return { type: 'success', texte: fb.texteArret };
      } else {
        return { type: 'warning', texte: fb.texteContinuer };
      }
    }

    // Musculaire seul
    if (has('dysfonction_musculaire') && !has('dysfonction_articulaire') && !has('tissulaire_extensibilite')) {
      return { type: 'warning', texte: regles.feedbacks.musculaire_seul.texte };
    }

    // Combinaison correcte : articulaire + tissulaire
    const articulaire = has('dysfonction_articulaire');
    const tissulaire  = has('tissulaire_extensibilite');
    if (articulaire && tissulaire) {
      return { type: 'success', texte: regles.feedbacks.articulaire_et_tissulaire.texte };
    }

    // Articulaire seul
    if (articulaire && !tissulaire) {
      return { type: 'warning', texte: regles.feedbacks.articulaire_seul.texte };
    }

    // Tissulaire seul
    if (tissulaire && !articulaire) {
      return { type: 'warning', texte: regles.feedbacks.tissulaire_seul.texte };
    }

    return { type: 'warning', texte: 'Sélection incomplète — cochez au moins une dysfonction.' };
  }

  // ============================================================
  // RECAP FINAL
  // ============================================================

  function renderRecapFinal() {
    const pct = totalChoices ? Math.round(((totalChoices - errors) / totalChoices) * 100) : 100;
    return `<div class="recap-final-block">
      <div class="score-circle ${pct >= 80 ? 'good' : pct >= 60 ? 'ok' : 'low'}">
        <span class="score-pct">${pct}%</span>
        <span class="score-sub">de bonnes réponses</span>
      </div>
      <div class="recap-steps">
        ${[
          ['Rythme',                  state.rythme],
          ['Type douloureux',         state.type_douleur ? 'Nociceptif mécanique' : null],
          ['Feu décisionnel',         state.feu],
          ['Tests orthopédiques',     state.spurling ? 'Spurling négatif' : null],
          ['Différentiation',         state.ctdt],
          ['Niveau vertébral',        state.niveau_vertebral],
          ['Préférence directionnelle', state.preference_directionnelle],
          ['Pronostic',               state.pronostic]
        ].filter(([,v]) => v)
          .map(([k,v]) => `<div class="recap-row"><span>${k}</span><strong>${v}</strong></div>`)
          .join('')}
      </div>
    </div>`;
  }

  function renderFullRecap() {
    const ampActifRows = [
      ['Flexion',         'flexion_active'],
      ['Extension',       'extension_active'],
      ['Inflexion droite','inflexion_D_active'],
      ['Inflexion gauche','inflexion_G_active'],
      ['Rotation droite', 'rotation_D_active'],
      ['Rotation gauche', 'rotation_G_active'],
      ['Protraction',     'protraction_active'],
      ['Rétraction',      'retraction_active']
    ].filter(([,k]) => state[k]);

    const ampPassifRows = [
      ['Extension',       'extension_passive'],
      ['Inflexion droite','inflexion_D_passive'],
      ['Inflexion gauche','inflexion_G_passive'],
      ['Rotation droite', 'rotation_D_passive']
    ].filter(([,k]) => state[k]);

    const cerveauRows = cerveauState ? Object.entries(cerveauState).map(([id, val]) => {
      const mouv = SCENARIOS['OnBrancleLeCerveau'].mouvements.find(m => m.id === id);
      const opts = val.options.join(' + ') || '—';
      return `<tr><td>${mouv ? mouv.label : id}</td><td>${opts}</td><td>${val.conduite || '—'}</td></tr>`;
    }).join('') : '';

    return `<div class="full-recap">
      <section>
        <h4>Anamnèse</h4>
        <p>Rythme : <strong>${state.rythme || '—'}</strong> — Type : <strong>${state.type_douleur ? 'nociceptif mécanique' : '—'}</strong> — Feu : <strong>${state.feu || '—'}</strong></p>
        <p>Topics explorés : <strong>${interrogatoire.askedTopics.size}</strong> / 13</p>
      </section>
      ${ampActifRows.length ? `<section>
        <h4>Amplitudes actives</h4>
        <table class="data-table">
          <thead><tr><th>Mouvement</th><th>Résultat</th></tr></thead>
          <tbody>${ampActifRows.map(([l,k]) =>
            `<tr><td>${l}</td><td><span class="tag ${getTagClass(state[k])}">${state[k]}</span></td></tr>`
          ).join('')}</tbody>
        </table>
      </section>` : ''}
      <section>
        <h4>Tests cliniques</h4>
        <p>Spurling : <strong>${state.spurling || '—'}</strong> — Distraction : <strong>${state.distraction || '—'}</strong> — Arm Squeeze : <strong>${state.arm_squeeze_test || '—'}</strong></p>
        <p>Différentiation cervico-thoracique : <strong>${state.ctdt || '—'}</strong></p>
      </section>
      ${ampPassifRows.length ? `<section>
        <h4>Amplitudes passives</h4>
        <table class="data-table">
          <thead><tr><th>Mouvement</th><th>Résultat</th></tr></thead>
          <tbody>${ampPassifRows.map(([l,k]) =>
            `<tr><td>${l}</td><td><span class="tag ${getTagClass(state[k])}">${state[k]}</span></td></tr>`
          ).join('')}</tbody>
        </table>
      </section>` : ''}
      ${cerveauRows ? `<section>
        <h4>On branche le cerveau</h4>
        <table class="data-table">
          <thead><tr><th>Mouvement</th><th>Dysfonction(s) cochée(s)</th><th>Conduite</th></tr></thead>
          <tbody>${cerveauRows}</tbody>
        </table>
      </section>` : ''}
      <section>
        <h4>Diagnostic</h4>
        <p>Niveau : <strong>${state.niveau_vertebral || '—'}</strong></p>
        <p>Préférence directionnelle : <strong>${state.preference_directionnelle || '—'}</strong></p>
        <p>Pronostic : <strong>${state.pronostic || '—'}</strong></p>
      </section>
    </div>`;
  }

  // ============================================================
  // GÉNÉRATION PDF
  // ============================================================

  function generatePDF() {
    const pct = totalChoices ? Math.round(((totalChoices - errors) / totalChoices) * 100) : 100;

    // Construire les lignes amplitudes actives
    const buildAmpActifTable = () => {
      const rows = [
        ['Flexion',         state.flexion_active],
        ['Extension',       state.extension_active],
        ['Inflexion droite',state.inflexion_D_active],
        ['Inflexion gauche',state.inflexion_G_active],
        ['Rotation droite', state.rotation_D_active],
        ['Rotation gauche', state.rotation_G_active],
        ['Protraction',     state.protraction_active],
        ['Rétraction',      state.retraction_active]
      ].filter(([,v]) => v);
      if (!rows.length) return '';
      return `<table>
        <thead><tr><th>Mouvement</th><th>Résultat</th></tr></thead>
        <tbody>${rows.map(([l,v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('')}</tbody>
      </table>`;
    };

    const buildAmpPassifTable = () => {
      const rows = [
        ['Extension',       state.extension_passive],
        ['Inflexion droite',state.inflexion_D_passive],
        ['Inflexion gauche',state.inflexion_G_passive],
        ['Rotation droite', state.rotation_D_passive]
      ].filter(([,v]) => v);
      if (!rows.length) return '';
      return `<table>
        <thead><tr><th>Mouvement</th><th>Résultat</th></tr></thead>
        <tbody>${rows.map(([l,v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join('')}</tbody>
      </table>`;
    };

    const buildCerveauTable = () => {
      if (!cerveauState || !Object.keys(cerveauState).length) return '';
      const rows = Object.entries(cerveauState).map(([id, val]) => {
        const mouv = SCENARIOS['OnBrancleLeCerveau'].mouvements.find(m => m.id === id);
        return `<tr><td>${mouv ? mouv.label : id}</td><td>${val.options.join(' + ') || '—'}</td><td>${val.conduite || '—'}</td></tr>`;
      }).join('');
      return `<table>
        <thead><tr><th>Mouvement</th><th>Dysfonction(s)</th><th>Conduite</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    };

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bilan — Rachis Cervical — Monsieur F</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; margin: 2cm; }
  h1 { color: #2c5282; font-size: 16pt; border-bottom: 2px solid #2c5282; padding-bottom: 6px; }
  h2 { color: #2d6a4f; font-size: 12pt; margin-top: 18px; margin-bottom: 4px; }
  h3 { font-size: 11pt; margin: 14px 0 4px; color: #444; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10pt; }
  th { background: #e8f4f8; text-align: left; padding: 5px 8px; }
  td { padding: 4px 8px; border-bottom: 1px solid #ddd; }
  .score-box { background: ${pct >= 80 ? '#d4edda' : pct >= 60 ? '#fff3cd' : '#f8d7da'};
    border-radius: 8px; padding: 12px 20px; display: inline-block; margin: 10px 0; }
  .score-num { font-size: 28pt; font-weight: bold; color: ${pct >= 80 ? '#155724' : pct >= 60 ? '#856404' : '#721c24'}; }
  .section { margin-bottom: 16px; }
  .tag-nfd { color: #e74c3c; font-weight: bold; }
  .tag-fd  { color: #e67e22; font-weight: bold; }
  .tag-fnd { color: #27ae60; font-weight: bold; }
  .ok { color: #27ae60; }
  .manquant { color: #e74c3c; }
  @media print {
    body { margin: 1cm; }
    button { display: none; }
  }
</style>
</head>
<body>
<h1>Bilan d'évaluation — Rachis Cervical</h1>
<p><strong>Cas clinique :</strong> Monsieur F, 53 ans, Plombier</p>
<p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</p>

<div class="score-box">
  <div class="score-num">${pct}%</div>
  <div>de bonnes réponses aux questions fermées</div>
</div>

<div class="section">
  <h2>1. Anamnèse</h2>
  <p>Topics explorés : <strong>${interrogatoire.askedTopics.size} / 13</strong></p>
  <h3>Raisonnement décisionnel</h3>
  <table>
    <tr><td><strong>Rythme</strong></td><td>${state.rythme || '—'}</td></tr>
    <tr><td><strong>Type douloureux</strong></td><td>${state.type_douleur ? 'Nociceptif mécanique (composante radiculaire possible)' : '—'}</td></tr>
    <tr><td><strong>Feu décisionnel</strong></td><td>${state.feu || '—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>2. Amplitudes de mouvement actives</h2>
  ${buildAmpActifTable() || '<p>Non complété</p>'}
</div>

<div class="section">
  <h2>3. Tests orthopédiques et de différentiation</h2>
  <table>
    <tr><td><strong>Spurling</strong></td><td>${state.spurling || '—'}</td></tr>
    <tr><td><strong>Distraction</strong></td><td>${state.distraction || '—'}</td></tr>
    <tr><td><strong>Arm Squeeze Test</strong></td><td>${state.arm_squeeze_test || '—'}</td></tr>
    <tr><td><strong>Bakody</strong></td><td>${state.bakody || '—'}</td></tr>
    <tr><td><strong>Flexion-rotation</strong></td><td>${state.flexion_rotation || '—'}</td></tr>
    <tr><td><strong>Différentiation cervico-thoracique</strong></td><td>${state.ctdt || '—'}</td></tr>
  </table>
</div>

<div class="section">
  <h2>4. Amplitudes de mouvement passives</h2>
  ${buildAmpPassifTable() || '<p>Non complété</p>'}
</div>

<div class="section">
  <h2>5. On branche le cerveau</h2>
  ${buildCerveauTable() || '<p>Non complété</p>'}
</div>

<div class="section">
  <h2>6. Palpation et diagnostic</h2>
  <table>
    <tr><td><strong>Observation</strong></td><td>${state.observation || '—'}</td></tr>
    <tr><td><strong>Niveau vertébral</strong></td><td>${state.niveau_vertebral || '—'}</td></tr>
    <tr><td><strong>Préférence directionnelle</strong></td><td>${state.preference_directionnelle || '—'}</td></tr>
    <tr><td><strong>Pronostic</strong></td><td>${state.pronostic || '—'}</td></tr>
  </table>
</div>

<hr>
<p style="font-size:9pt;color:#888;">Généré par le module e-learning Rachis Cervical — Monsieur F.</p>

<button onclick="window.print()"
  style="margin-top:16px;padding:10px 24px;background:#2c5282;color:#fff;border:none;
  border-radius:6px;font-size:11pt;cursor:pointer;">
  Enregistrer en PDF
</button>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      // Auto-print après chargement
      win.onload = () => setTimeout(() => win.print(), 500);
    }
  }

  // ============================================================
  // NAVIGATION + PROGRESSION
  // ============================================================

  function handleChoice(choice, step) {
    if (step.type !== 'error') {
      totalChoices++;
      if (!choice.correct) errors++;
    }
    if (choice.action === 'downloadPDF') { generatePDF(); return; }
    navigate(choice.next, choice.restart);
  }

  function navigate(nextId, restart = false) {
    if (!nextId) return;
    if (restart) {
      state               = {};
      navHistory          = [];
      errors              = 0;
      totalChoices        = 0;
      interrogatoire      = { active: false, askedTopics: new Set(), chatLog: [], offTopicIndex: 0 };
      examenLibreState    = {};
      observationState    = { descriptionDonnee: false, antalgiqueMentionne: false, mouvementOpposeDemandeé: false, chatLog: [] };
      cerveauState        = {};
      argumentsCoches     = {};

      const df = dom.dossierFields();  if (df) df.innerHTML = '';
      const ef = dom.examFields();     if (ef) ef.innerHTML = '';
      const es = dom.examSection();    if (es) es.style.display = 'none';
      const titleEl = dom.dossierTitle(); if (titleEl) titleEl.textContent = 'Dossier Patient';
      hideDossier();
    }
    navHistory.push(currentStep);
    currentStep = nextId;
    render(nextId);
  }

  function updateProgress(stepId) {
    const idx = ETAPES.findIndex(e => stepId === e.id || stepId.startsWith(e.id));
    const pct = idx >= 0 ? Math.round(((idx + 1) / ETAPES.length) * 100) : 0;
    const fill = dom.progress();
    if (fill) fill.style.width = pct + '%';

    ETAPES.forEach((e, i) => {
      const marker = document.getElementById(`marker-${i}`);
      if (!marker) return;
      const visited = navHistory.some(h => h === e.id || h.startsWith(e.id)) || stepId === e.id;
      marker.classList.toggle('active', visited);
    });
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    const markersEl = document.getElementById('progress-markers');
    if (markersEl) {
      ETAPES.forEach((e, i) => {
        const m = document.createElement('div');
        m.className = 'progress-marker';
        m.id = `marker-${i}`;
        m.title = e.label;
        m.innerHTML = `<span>${e.num}</span>`;
        markersEl.appendChild(m);
      });
    }

    // Boutons toggle dossier mobile
    const closeBtn  = document.getElementById('dossier-close-btn');
    const fab       = document.getElementById('dossier-fab');
    const backdrop  = document.getElementById('dossier-backdrop');
    if (closeBtn)  closeBtn.addEventListener('click', closeDossierMobile);
    if (fab)       fab.addEventListener('click', openDossierMobile);
    if (backdrop)  backdrop.addEventListener('click', closeDossierMobile);

    // SCORM : initialisation de la session LMS
    SCORM.init();
    window.addEventListener('beforeunload', () => SCORM.finish());

    render('Start');
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', () => App.init());