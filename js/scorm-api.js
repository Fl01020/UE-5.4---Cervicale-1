/* ============================================================
   SCORM 1.2 API — Wrapper minimal
   Rachis Cervical — IFEC Formation Continue
   ============================================================
   Recherche l'objet API dans la hiérarchie des fenêtres,
   expose init / setValue / commit / finish / reportCompletion.
   Compatible Moodle (SCORM 1.2).
   ============================================================ */

const SCORM = (() => {

  let _api  = null;
  let _init = false;

  // ── Recherche de l'objet API SCORM dans les fenêtres parentes ──
  function _findAPI(win) {
    let attempts = 0;
    while (!win.API && win.parent && win.parent !== win && attempts < 10) {
      win = win.parent;
      attempts++;
    }
    return win.API || null;
  }

  function _getAPI() {
    if (_api) return _api;
    _api = _findAPI(window);
    if (!_api && window.opener) _api = _findAPI(window.opener);
    return _api;
  }

  // ── Initialisation de la session LMS ──
  function init() {
    const api = _getAPI();
    if (!api) {
      console.info('[SCORM] API non trouvée — mode hors-LMS.');
      return false;
    }
    try {
      const result = api.LMSInitialize('');
      _init = (result === 'true' || result === true);
      if (_init) {
        console.info('[SCORM] Session initialisée.');
      }
      return _init;
    } catch (e) {
      console.warn('[SCORM] LMSInitialize error:', e);
      return false;
    }
  }

  // ── Écriture d'une valeur CMI ──
  function setValue(key, value) {
    if (!_init) return false;
    const api = _getAPI();
    if (!api) return false;
    try {
      return api.LMSSetValue(key, String(value)) === 'true';
    } catch (e) {
      console.warn('[SCORM] LMSSetValue error:', key, e);
      return false;
    }
  }

  // ── Envoi des données au LMS ──
  function commit() {
    if (!_init) return;
    const api = _getAPI();
    if (!api) return;
    try { api.LMSCommit(''); } catch (e) {}
  }

  // ── Fin de session ──
  function finish() {
    if (!_init) return;
    const api = _getAPI();
    if (!api) return;
    try {
      api.LMSCommit('');
      api.LMSFinish('');
      _init = false;
      console.info('[SCORM] Session terminée.');
    } catch (e) {}
  }

  // ── Rapport de score et de complétion ──
  // scorePct  : entier 0-100
  // masteryScore : seuil de réussite (ex. 70)
  function reportCompletion(scorePct, masteryScore) {
    if (!_init) return;
    const status = scorePct >= masteryScore ? 'passed' : 'failed';
    setValue('cmi.core.score.min',    '0');
    setValue('cmi.core.score.max',    '100');
    setValue('cmi.core.score.raw',    String(scorePct));
    setValue('cmi.core.lesson_status', status);
    commit();
    console.info(`[SCORM] Rapport envoyé — score: ${scorePct}%, statut: ${status}`);
  }

  return { init, setValue, commit, finish, reportCompletion };

})();
