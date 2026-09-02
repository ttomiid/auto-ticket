(function () {
  'use strict';

  // ---------- Semillas (solo se usan la primera vez, si no hay nada guardado) ----------

  const SEED_SEVERITIES = ['Baja', 'Media', 'Alta', 'Crítica'];
  const SEED_ACTIONS = [
    'Aislar host de la red',
    'Deshabilitar cuenta comprometida',
    'Forzar reset de credenciales',
    'Bloquear IOC en perímetro',
    'Escalar a IR / respuesta a incidentes',
  ];

  const SEVERITY_COLOR_CLASS = {
    'baja': 'sev-baja',
    'media': 'sev-media',
    'alta': 'sev-alta',
    'crítica': 'sev-critica',
    'critica': 'sev-critica',
  };

  const STORAGE_KEYS = {
    severities: 'socTicketComposer:severities',
    actions: 'socTicketComposer:actions',
    tabs: 'socTicketComposer:tabs',
    activeTab: 'socTicketComposer:activeTab',
  };

  // ---------- Persistencia local ----------

  function loadJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // localStorage no disponible (modo privado, cuota llena, etc.) — sigue funcionando en memoria.
    }
  }

  function normalized(value) {
    return value.trim().toLowerCase();
  }

  function makeId() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function emptyTab() {
    return {
      id: makeId(),
      name: '',
      severity: state.severities[0] || '',
      selectedActions: [],
      alertTitle: '',
      iocs: '',
      assets: '',
      notes: '',
    };
  }

  // ---------- Estado ----------

  const state = {
    severities: loadJSON(STORAGE_KEYS.severities, SEED_SEVERITIES.slice()),
    actions: loadJSON(STORAGE_KEYS.actions, SEED_ACTIONS.slice()),
    tabs: [],
    activeTabId: null,
  };

  state.tabs = loadJSON(STORAGE_KEYS.tabs, null) || [emptyTab()];
  if (state.tabs.length === 0) state.tabs = [emptyTab()];

  const savedActiveId = loadJSON(STORAGE_KEYS.activeTab, null);
  state.activeTabId = state.tabs.some((t) => t.id === savedActiveId)
    ? savedActiveId
    : state.tabs[0].id;

  function persistLibraries() {
    saveJSON(STORAGE_KEYS.severities, state.severities);
    saveJSON(STORAGE_KEYS.actions, state.actions);
  }

  function persistTabs() {
    saveJSON(STORAGE_KEYS.tabs, state.tabs);
    saveJSON(STORAGE_KEYS.activeTab, state.activeTabId);
  }

  function activeTab() {
    return state.tabs.find((t) => t.id === state.activeTabId);
  }

  const els = {
    tabBar: document.getElementById('tabBar'),
    addTabBtn: document.getElementById('addTabBtn'),
    exportShiftBtn: document.getElementById('exportShiftBtn'),
    printReport: document.getElementById('printReport'),
    severityGroup: document.getElementById('severityGroup'),
    severityAddInput: document.getElementById('severityAddInput'),
    severityAddBtn: document.getElementById('severityAddBtn'),
    actionsGroup: document.getElementById('actionsGroup'),
    actionAddInput: document.getElementById('actionAddInput'),
    actionAddBtn: document.getElementById('actionAddBtn'),
    alertTitle: document.getElementById('alertTitle'),
    iocs: document.getElementById('iocs'),
    assets: document.getElementById('assets'),
    analystNotes: document.getElementById('analystNotes'),
    previewOutput: document.getElementById('previewOutput'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    copyToast: document.getElementById('copyToast'),
    statusPill: document.getElementById('statusPill'),
  };

  // ---------- Helpers de texto ----------

  function linesFrom(value) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function formatArray(items, emptyLabel) {
    if (!items || items.length === 0) return emptyLabel;
    return items.map((item) => `  - ${item}`).join('\n');
  }

  function timestamp() {
    const now = new Date();
    return now.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function rawLabel(tab, index) {
    if (tab.name && tab.name.trim()) return tab.name.trim();
    const title = tab.alertTitle.trim();
    if (title) return title;
    return `Alerta ${index + 1}`;
  }

  function tabLabel(tab, index) {
    const label = rawLabel(tab, index);
    return label.length > 22 ? label.slice(0, 22) + '…' : label;
  }

  // ---------- Barra de pestañas ----------

  function renderTabBar() {
    els.tabBar.querySelectorAll('.tab').forEach((el) => el.remove());

    state.tabs.forEach((tab, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(tab.id === state.activeTabId));
      btn.title = rawLabel(tab, index) + ' (doble clic para renombrar)';

      const label = document.createElement('span');
      label.textContent = tabLabel(tab, index);
      label.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        startRenameTab(tab, index, btn, label);
      });
      btn.appendChild(label);

      const close = document.createElement('span');
      close.className = 'tab-close';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Cerrar pestaña');
      close.addEventListener('click', (event) => {
        event.stopPropagation();
        closeTab(tab.id);
      });
      btn.appendChild(close);

      btn.addEventListener('click', () => switchTab(tab.id));
      els.tabBar.insertBefore(btn, els.addTabBtn);
    });
  }

  function startRenameTab(tab, index, tabBtn, labelSpan) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = rawLabel(tab, index);
    input.maxLength = 60;

    tabBtn.replaceChild(input, labelSpan);
    input.focus();
    input.select();

    let settled = false;
    function commit() {
      if (settled) return;
      settled = true;
      tab.name = input.value.trim();
      persistTabs();
      renderTabBar();
    }

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        settled = true;
        renderTabBar();
      }
    });
    input.addEventListener('blur', commit);
    input.addEventListener('click', (event) => event.stopPropagation());
  }

  function loadTabIntoForm(tab) {
    els.alertTitle.value = tab.alertTitle;
    els.iocs.value = tab.iocs;
    els.assets.value = tab.assets;
    els.analystNotes.value = tab.notes;
    renderSeverityChips();
    renderActionChips();
    render();
  }

  function switchTab(id) {
    if (id === state.activeTabId) return;
    state.activeTabId = id;
    persistTabs();
    renderTabBar();
    loadTabIntoForm(activeTab());
  }

  function addTab() {
    const tab = emptyTab();
    state.tabs.push(tab);
    state.activeTabId = tab.id;
    persistTabs();
    renderTabBar();
    loadTabIntoForm(tab);
    els.alertTitle.focus();
  }

  function closeTab(id) {
    const index = state.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    state.tabs.splice(index, 1);

    if (state.tabs.length === 0) {
      state.tabs.push(emptyTab());
    }

    if (state.activeTabId === id) {
      const nextIndex = Math.max(0, index - 1);
      state.activeTabId = state.tabs[Math.min(nextIndex, state.tabs.length - 1)].id;
      loadTabIntoForm(activeTab());
    }

    persistTabs();
    renderTabBar();
  }

  // ---------- Campos de texto: guardan en la pestaña activa ----------

  function syncFieldsToActiveTab() {
    const tab = activeTab();
    tab.alertTitle = els.alertTitle.value;
    tab.iocs = els.iocs.value;
    tab.assets = els.assets.value;
    tab.notes = els.analystNotes.value;
    persistTabs();
    renderTabBar(); // el título puede haber cambiado el label de la pestaña
    render();
  }

  // ---------- Render: chips de severidad ----------

  function renderSeverityChips() {
    const tab = activeTab();
    els.severityGroup.innerHTML = '';

    state.severities.forEach((value) => {
      const colorClass = SEVERITY_COLOR_CLASS[normalized(value)] || null;
      const isActive = tab.severity === value;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (colorClass ? ` ${colorClass}` : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(isActive));

      const label = document.createElement('span');
      label.textContent = value;
      btn.appendChild(label);

      const remove = document.createElement('span');
      remove.className = 'chip-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Borrar "${value}" de la lista de severidades`);
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        removeSeverity(value);
      });
      btn.appendChild(remove);

      btn.addEventListener('click', () => setSeverity(value));
      els.severityGroup.appendChild(btn);
    });
  }

  function setSeverity(value) {
    activeTab().severity = value;
    persistTabs();
    renderSeverityChips();
    render();
  }

  function addSeverity(rawValue) {
    const value = rawValue.trim();
    if (!value) return;
    const exists = state.severities.some((s) => normalized(s) === normalized(value));
    if (exists) return;

    state.severities.push(value);
    persistLibraries();
    setSeverity(value);
  }

  function removeSeverity(value) {
    if (state.severities.length <= 1) {
      showToast('Tiene que quedar al menos una severidad');
      return;
    }
    if (!window.confirm(`Borrar "${value}" de la lista de severidades para todas las alertas?`)) {
      return;
    }

    state.severities = state.severities.filter((s) => s !== value);
    persistLibraries();

    state.tabs.forEach((tab) => {
      if (tab.severity === value) {
        tab.severity = state.severities[0];
      }
    });
    persistTabs();

    renderSeverityChips();
    render();
  }

  // ---------- Render: chips de acciones (multi-select) ----------

  function renderActionChips() {
    const tab = activeTab();
    els.actionsGroup.innerHTML = '';

    state.actions.forEach((action) => {
      const isActive = tab.selectedActions.includes(action);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'checkbox');
      btn.setAttribute('aria-checked', String(isActive));
      btn.setAttribute('aria-pressed', String(isActive));

      const label = document.createElement('span');
      label.textContent = action;
      btn.appendChild(label);

      const remove = document.createElement('span');
      remove.className = 'chip-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Borrar "${action}" de la lista de acciones`);
      remove.addEventListener('click', (event) => {
        event.stopPropagation();
        removeAction(action);
      });
      btn.appendChild(remove);

      btn.addEventListener('click', () => toggleAction(action));
      els.actionsGroup.appendChild(btn);
    });
  }

  function toggleAction(action) {
    const tab = activeTab();
    const idx = tab.selectedActions.indexOf(action);
    if (idx === -1) {
      tab.selectedActions.push(action);
    } else {
      tab.selectedActions.splice(idx, 1);
    }
    persistTabs();
    renderActionChips();
    render();
  }

  function addAction(rawValue) {
    const value = rawValue.trim();
    if (!value) return;
    const exists = state.actions.some((a) => normalized(a) === normalized(value));
    if (exists) return;

    state.actions.push(value);
    persistLibraries();

    const tab = activeTab();
    tab.selectedActions.push(value);
    persistTabs();

    renderActionChips();
    render();
  }

  function removeAction(action) {
    if (!window.confirm(`Borrar "${action}" de la lista de acciones para todas las alertas?`)) {
      return;
    }

    state.actions = state.actions.filter((a) => a !== action);
    persistLibraries();

    state.tabs.forEach((tab) => {
      tab.selectedActions = tab.selectedActions.filter((a) => a !== action);
    });
    persistTabs();

    renderActionChips();
    render();
  }

  // ---------- Ticket ----------

  function buildTicketFor(tab) {
    const title = tab.alertTitle.trim() || 'Sin título';
    const notes = tab.notes.trim() || 'Sin notas adicionales.';

    return [
      `[ESCALAMIENTO L2 — SEVERIDAD ${(tab.severity || 'SIN DEFINIR').toUpperCase()}]`,
      '',
      `Alerta original: ${title}`,
      `Generado: ${timestamp()}`,
      '',
      'Indicadores:',
      formatArray(linesFrom(tab.iocs), '  (sin indicadores registrados)'),
      '',
      'Activos afectados:',
      formatArray(linesFrom(tab.assets), '  (sin activos registrados)'),
      '',
      'Notas del analista:',
      notes,
      '',
      'Acciones recomendadas para L2:',
      formatArray(tab.selectedActions, '  (sin acciones especificadas)'),
    ].join('\n');
  }

  function buildTicket() {
    return buildTicketFor(activeTab());
  }

  function render() {
    els.previewOutput.textContent = buildTicket();
  }

  // ---------- Toast / copiar / descargar ----------

  function showToast(message) {
    els.copyToast.textContent = message;
    els.copyToast.classList.add('visible');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      els.copyToast.classList.remove('visible');
    }, 2200);
  }

  async function copyTicket() {
    const text = buildTicket();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copiado al portapapeles');
    } catch (err) {
      showToast('No se pudo copiar — seleccioná el texto manualmente');
    }
  }

  function downloadTicket() {
    const text = buildTicket();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `ticket-l2-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportShiftReport() {
    // Sincronizar la pestaña activa por si el usuario todavía tiene el cursor en un campo.
    syncFieldsToActiveTab();

    els.printReport.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'print-report-header';
    const now = new Date();
    const dateStr = now.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
    header.innerHTML =
      `<h1>Reporte de turno — Auto Ticket</h1>` +
      `<p>${dateStr} · ${state.tabs.length} alerta${state.tabs.length === 1 ? '' : 's'}</p>`;
    els.printReport.appendChild(header);

    state.tabs.forEach((tab, index) => {
      const block = document.createElement('section');
      block.className = 'ticket-block';

      const heading = document.createElement('h2');
      heading.textContent = `${index + 1}. ${rawLabel(tab, index)}`;
      block.appendChild(heading);

      const pre = document.createElement('pre');
      pre.textContent = buildTicketFor(tab);
      block.appendChild(pre);

      els.printReport.appendChild(block);
    });

    document.body.classList.add('printing');
    window.print();
  }

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
  });

  function resetActiveTab() {
    const tab = activeTab();
    tab.alertTitle = '';
    tab.iocs = '';
    tab.assets = '';
    tab.notes = '';
    tab.severity = state.severities[0] || '';
    tab.selectedActions = [];
    persistTabs();
    loadTabIntoForm(tab);
    renderTabBar();
  }

  // ---------- Eventos ----------

  els.addTabBtn.addEventListener('click', addTab);
  els.exportShiftBtn.addEventListener('click', exportShiftReport);

  [els.alertTitle, els.iocs, els.assets, els.analystNotes].forEach((el) => {
    el.addEventListener('input', syncFieldsToActiveTab);
  });

  els.severityAddBtn.addEventListener('click', () => {
    addSeverity(els.severityAddInput.value);
    els.severityAddInput.value = '';
    els.severityAddInput.focus();
  });

  els.severityAddInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      els.severityAddBtn.click();
    }
  });

  els.actionAddBtn.addEventListener('click', () => {
    addAction(els.actionAddInput.value);
    els.actionAddInput.value = '';
    els.actionAddInput.focus();
  });

  els.actionAddInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      els.actionAddBtn.click();
    }
  });

  els.copyBtn.addEventListener('click', copyTicket);
  els.downloadBtn.addEventListener('click', downloadTicket);
  els.resetBtn.addEventListener('click', resetActiveTab);

  // ---------- Inicialización ----------

  persistLibraries();
  persistTabs();
  renderTabBar();
  loadTabIntoForm(activeTab());
})();