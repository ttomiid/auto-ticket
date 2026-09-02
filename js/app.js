(function () {
  'use strict';

  const state = {
    severity: 'Alta',
  };

  const els = {
    sevButtons: document.querySelectorAll('.sev-btn'),
    alertTitle: document.getElementById('alertTitle'),
    iocs: document.getElementById('iocs'),
    assets: document.getElementById('assets'),
    analystNotes: document.getElementById('analystNotes'),
    recommendation: document.getElementById('recommendation'),
    previewOutput: document.getElementById('previewOutput'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    copyToast: document.getElementById('copyToast'),
    statusPill: document.getElementById('statusPill'),
  };

  function linesFrom(value) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function formatList(value, emptyLabel) {
    const lines = linesFrom(value);
    if (lines.length === 0) return emptyLabel;
    return lines.map((line) => `  - ${line}`).join('\n');
  }

  function timestamp() {
    const now = new Date();
    return now.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function buildTicket() {
    const title = els.alertTitle.value.trim() || 'Sin título';
    const notes = els.analystNotes.value.trim() || 'Sin notas adicionales.';
    const recommendation = els.recommendation.value || 'Sin especificar';

    return [
      `[ESCALAMIENTO L2 — SEVERIDAD ${state.severity.toUpperCase()}]`,
      '',
      `Alerta original: ${title}`,
      `Generado: ${timestamp()}`,
      '',
      'Indicadores:',
      formatList(els.iocs.value, '  (sin indicadores registrados)'),
      '',
      'Activos afectados:',
      formatList(els.assets.value, '  (sin activos registrados)'),
      '',
      'Notas del analista:',
      notes,
      '',
      `Acción recomendada: ${recommendation}`,
    ].join('\n');
  }

  function render() {
    els.previewOutput.textContent = buildTicket();
  }

  function setSeverity(value) {
    state.severity = value;
    els.sevButtons.forEach((btn) => {
      const isActive = btn.dataset.value === value;
      btn.setAttribute('aria-checked', String(isActive));
    });
    render();
  }

  function showToast(message) {
    els.copyToast.textContent = message;
    els.copyToast.classList.add('visible');
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      els.copyToast.classList.remove('visible');
    }, 2000);
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

  function resetForm() {
    els.alertTitle.value = '';
    els.iocs.value = '';
    els.assets.value = '';
    els.analystNotes.value = '';
    els.recommendation.value = '';
    setSeverity('Alta');
    els.statusPill.textContent = 'Borrador';
    render();
  }

  els.sevButtons.forEach((btn) => {
    btn.addEventListener('click', () => setSeverity(btn.dataset.value));
  });

  [els.alertTitle, els.iocs, els.assets, els.analystNotes, els.recommendation].forEach((el) => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  els.copyBtn.addEventListener('click', copyTicket);
  els.downloadBtn.addEventListener('click', downloadTicket);
  els.resetBtn.addEventListener('click', resetForm);

  render();
})();
