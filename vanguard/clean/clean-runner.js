/* VanGuard Clean — cleaner runner module
 * UI-agnostic state machine for the core cleaning workflow.
 * The existing index.html can adopt this module without changing the database schema.
 */
(function () {
  'use strict';

  const RESULT_VALUES = ['pass', 'fail', 'na', 'pending'];

  function makeRunner({ site, checklist, items, recordId = null }) {
    const state = {
      recordId,
      site,
      checklist,
      items: (items || []).map((item, index) => ({
        id: item.id,
        label: item.label,
        required: item.required !== false,
        sort_order: item.sort_order ?? index,
        result: item.result || 'pending',
        note: item.note || '',
        evidence: item.evidence || []
      })),
      generalNote: '',
      issues: [],
      startedAt: new Date().toISOString()
    };

    function item(id) {
      return state.items.find(x => x.id === id);
    }

    function setResult(id, result) {
      if (!RESULT_VALUES.includes(result)) throw new Error('Invalid checklist result');
      const target = item(id);
      if (!target) throw new Error('Checklist item not found');
      target.result = result;
      return target;
    }

    function setNote(id, note) {
      const target = item(id);
      if (!target) throw new Error('Checklist item not found');
      target.note = String(note || '').slice(0, 2000);
      return target;
    }

    function addEvidence(id, evidence) {
      const target = item(id);
      if (!target) throw new Error('Checklist item not found');
      target.evidence.push(evidence);
      return target;
    }

    function addIssue(issue) {
      const cleanIssue = {
        title: String(issue.title || '').trim().slice(0, 200),
        description: String(issue.description || '').trim().slice(0, 2000),
        severity: ['low', 'medium', 'high', 'critical'].includes(issue.severity) ? issue.severity : 'medium',
        due_date: issue.due_date || null
      };
      if (!cleanIssue.title) throw new Error('Issue title is required');
      state.issues.push(cleanIssue);
      return cleanIssue;
    }

    function validation() {
      const required = state.items.filter(x => x.required);
      const pending = required.filter(x => x.result === 'pending');
      const failed = required.filter(x => x.result === 'fail');
      return {
        valid: pending.length === 0,
        pending,
        failed,
        completedCount: state.items.filter(x => x.result !== 'pending').length,
        totalCount: state.items.length,
        completionPercent: state.items.length ? Math.round((state.items.filter(x => x.result !== 'pending').length / state.items.length) * 100) : 0
      };
    }

    function buildRecordPayload(cleanerName) {
      const check = validation();
      return {
        id: state.recordId,
        site_id: state.site && state.site.id,
        checklist_id: state.checklist && state.checklist.id,
        cleaner_name: String(cleanerName || '').trim(),
        status: check.failed.length ? 'flagged' : (check.valid ? 'completed' : 'in_progress'),
        started_at: state.startedAt,
        completed_at: check.valid ? new Date().toISOString() : null,
        notes: state.generalNote,
        items: state.items.map(x => ({
          checklist_item_id: x.id,
          label: x.label,
          result: x.result,
          note: x.note
        })),
        issues: state.issues.slice()
      };
    }

    return {
      state,
      item,
      setResult,
      setNote,
      addEvidence,
      addIssue,
      validation,
      buildRecordPayload
    };
  }

  window.VGCleanRunner = { RESULT_VALUES, makeRunner };
})();
