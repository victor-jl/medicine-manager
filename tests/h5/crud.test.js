// tests/h5/crud.test.js
// Tests for the H5 inline script in h5/index.html. The page's JS lives inside
// a <script> block; we extract it, run it inside a `vm` sandbox with mocked
// `localStorage`/`document`/`prompt`/`confirm`, then invoke the page's
// functions and assert storage/UI side effects.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadH5Page() {
  const html = fs.readFileSync(
    path.resolve(__dirname, '../../h5/index.html'),
    'utf8'
  );
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No <script> block found in h5/index.html');
  const scriptSrc = match[1];

  // Minimal DOM mock: each element tracks .value and the message div tracks
  // class/text. Only the elements referenced by the script are needed.
  const elements = new Map();
  function makeEl(id) {
    return {
      id,
      value: '',
      textContent: '',
      style: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); }
      },
      innerHTML: ''
    };
  }
  for (const id of [
    'medName', 'medExpiry', 'medDesc', 'btnRecord', 'msg',
    'medicinesList', 'recordsList', 'casesList',
    'addForm', 'medicinesTab', 'recordsTab', 'casesTab'
  ]) {
    elements.set(id, makeEl(id));
  }

  // Per-test state.
  const storage = new Map();
  const messages = []; // [{ text, type, displayed }]
  const promptResponses = [];
  const confirmResponses = [];

  const sandbox = {
    localStorage: {
      getItem(k) {
        return storage.has(k) ? storage.get(k) : null;
      },
      setItem(k, v) {
        storage.set(k, String(v));
      },
      removeItem(k) {
        storage.delete(k);
      }
    },
    document: {
      getElementById(id) {
        return elements.get(id) || null;
      },
      querySelectorAll() {
        return Array.from(elements.values()).filter((e) => e.id && e.classList);
      }
    },
    prompt(msg) {
      const next = promptResponses.shift();
      return next === undefined ? null : next;
    },
    confirm(msg) {
      const next = confirmResponses.shift();
      return next === undefined ? true : next;
    },
    setTimeout: (fn, _ms) => { fn(); return 0; },
    Date,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };
  // Initial active class is set in the HTML; mirror it for classList checks.
  elements.get('medicinesTab').style.display = 'block';
  elements.get('recordsTab').style.display = 'none';
  elements.get('casesTab').style.display = 'none';

  vm.createContext(sandbox);
  vm.runInContext(scriptSrc, sandbox);

  return {
    sandbox,
    elements,
    storage,
    messages,
    confirmResponses,
    promptResponses,
    getMedicines() {
      return JSON.parse(storage.get('medicines') || '[]');
    },
    getRecords() {
      return JSON.parse(storage.get('records') || '[]');
    },
    getCases() {
      return JSON.parse(storage.get('cases') || '[]');
    }
  };
}

test('saveMedicine: rejects when name is blank', () => {
  const page = loadH5Page();
  page.sandbox.saveMedicine();
  assert.equal(page.getMedicines().length, 0);
  // The success message helper is not called on the failure path; the
  // medicine list stays empty. The script does not set the message for the
  // failure case in this version, so the only observable contract is the
  // empty storage.
});

test('saveMedicine: writes a new medicine with the supplied fields', () => {
  const page = loadH5Page();
  page.elements.get('medName').value = 'Ibuprofen';
  page.elements.get('medExpiry').value = '2027-12-31';
  page.elements.get('medDesc').value = 'take with food';
  page.sandbox.saveMedicine();
  const meds = page.getMedicines();
  assert.equal(meds.length, 1);
  assert.equal(meds[0].name, 'Ibuprofen');
  assert.equal(meds[0].expiryDate, '2027-12-31');
  assert.equal(meds[0].description, 'take with food');
  assert.equal(typeof meds[0].id, 'number');
  assert.equal(typeof meds[0].createTime, 'string');
});

test('quickRecord: appends a record for the given medicine', () => {
  const page = loadH5Page();
  page.sandbox.quickRecord('Aspirin', 42);
  const recs = page.getRecords();
  assert.equal(recs.length, 1);
  assert.equal(recs[0].medicineId, 42);
  assert.equal(recs[0].medicineName, 'Aspirin');
});

test('recordTake: requires a medicine name to be set first', () => {
  const page = loadH5Page();
  page.elements.get('medName').value = '';
  page.sandbox.recordTake();
  assert.equal(page.getRecords().length, 0);
});

test('recordTake: appends a record using the in-form name', () => {
  const page = loadH5Page();
  page.elements.get('medName').value = 'VitaminC';
  page.sandbox.recordTake();
  const recs = page.getRecords();
  assert.equal(recs.length, 1);
  assert.equal(recs[0].medicineName, 'VitaminC');
  // medicineId uses Date.now() in the form, so just assert numeric.
  assert.equal(typeof recs[0].medicineId, 'number');
});

test('deleteMedicine: removes the entry on confirm and leaves it on cancel', () => {
  // Confirm-true case.
  const page1 = loadH5Page();
  page1.storage.set('medicines', JSON.stringify([
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
  ]));
  // The default confirm response is true (see mock), so we just call.
  page1.sandbox.deleteMedicine(1);
  const meds1 = page1.getMedicines();
  assert.equal(meds1.length, 1);
  assert.equal(meds1[0].id, 2);

  // Confirm-false case.
  const page2 = loadH5Page();
  page2.confirmResponses.push(false);
  page2.storage.set('medicines', JSON.stringify([{ id: 1, name: 'A' }]));
  page2.sandbox.deleteMedicine(1);
  assert.equal(page2.getMedicines().length, 1);
});

test('showAddCase: appends a case from prompt() response', () => {
  const page = loadH5Page();
  page.promptResponses.push('咳嗽、低烧两天');
  page.sandbox.showAddCase();
  const cases = page.getCases();
  assert.equal(cases.length, 1);
  assert.equal(cases[0].content, '咳嗽、低烧两天');
  assert.equal(typeof cases[0].id, 'number');
});

test('showAddCase: prompt() cancel/blank leaves storage unchanged', () => {
  const page = loadH5Page();
  page.promptResponses.push(null);
  page.sandbox.showAddCase();
  page.promptResponses.push('');
  page.sandbox.showAddCase();
  assert.equal(page.getCases().length, 0);
});

test('switchTab: toggles the medicines/records/cases panels', () => {
  const page = loadH5Page();
  // The H5 source references the browser global `event` inside switchTab
  // even when called directly — provide a stub for it in the sandbox.
  page.sandbox.event = { target: { classList: { add: () => {} } } };
  page.sandbox.switchTab('records');
  // The script sets event.target.classList.add('active'), but since we
  // synthesised the click via a direct call, the tab visuals are driven by
  // the inline click handler binding. Verify the *fallback* path: the
  // display swap happens unconditionally based on the `tab` arg.
  assert.equal(page.elements.get('medicinesTab').style.display, 'none');
  assert.equal(page.elements.get('recordsTab').style.display, 'block');
  assert.equal(page.elements.get('casesTab').style.display, 'none');
});
