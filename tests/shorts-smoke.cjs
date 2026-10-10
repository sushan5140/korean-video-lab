'use strict';
/* Dependency-free Shorts regression check: node tests/shorts-smoke.cjs */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const shortsFile = fs.readFileSync(path.join(root, 'shorts', 'shorts.js'), 'utf8');
new vm.Script(shortsFile, { filename: 'shorts/shorts.js' });

let checked = 0;
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const source = match[1];
  if (!source.trim()) continue;
  new vm.Script(source, { filename: 'index.html:inline-' + (++checked) });
}
assert.ok(checked >= 3, 'Expected inline scripts to compile');
assert.match(html, /id="haneulShorts"/);
assert.match(html, /id="shortsInlinePlayer"/);
assert.match(html, /id="sideShortsJump"/);

const bundled = html.match(/<script id="haneul-shorts-bundled-v2">([\s\S]*?)<\/script>/);
assert.ok(bundled, 'The production Shorts script must be bundled');

const elements = new Map();
const visited = [];
class FakeElement {
  constructor(tag = 'div') {
    this.tag = tag;
    this.listeners = {};
    this.children = [];
    this.style = {};
    this.hidden = false;
    this.dataset = {};
    this.classes = new Set();
    this.classList = {
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name)
    };
  }
  set id(value) { this._id = value; elements.set(value, this); }
  get id() { return this._id; }
  set innerHTML(markup) {
    this.markup = markup;
    for (const [, id] of markup.matchAll(/id="([^"]+)"/g)) {
      if (!elements.has(id)) { const el = new FakeElement(); el.id = id; }
    }
  }
  get innerHTML() { return this.markup || ''; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  click() { if (this.listeners.click) this.listeners.click({ target: this, preventDefault() {} }); }
  setAttribute(name, value) { this[name] = value; }
  replaceChildren(...children) { this.children = children; }
  appendChild(element) { this.children.push(element); }
}
for (const id of ['haneulShorts', 'shortsInlinePlayer']) {
  const element = new FakeElement();
  element.id = id;
}
const document = {
  getElementById: id => elements.get(id) || null,
  createElement: tag => new FakeElement(tag),
  addEventListener() {},
  body: { style: {} }
};
const appWindow = {};
const localStorage = { getItem: () => null, setItem() {} };
const showMainPage = name => visited.push(name);
vm.runInNewContext(bundled[1], {
  document, window: appWindow, localStorage, showMainPage
}, { filename: 'shorts:runtime', timeout: 3000 });
assert.equal(typeof appWindow.haneulOpenShorts, 'function', 'Shorts opener must initialize');
appWindow.haneulOpenShorts(0);
assert.ok(elements.get('shortsOverlay').classList.contains('isOpen'), 'Reel should open');
assert.match(elements.get('shortsVideo').children[0].src, /\/embed\/WyWdNJxHbkM/);
assert.equal(visited[0], 'shorts');
elements.get('shortsNext').click();
assert.equal(elements.get('shortsCounter').textContent, '2 / 14');
appWindow.haneulCloseShorts();
assert.ok(!elements.get('shortsOverlay').classList.contains('isOpen'), 'Reel should close');
assert.equal(visited.at(-1), 'discover');
console.log('PASS: ' + checked + ' inline scripts compile; Shorts open/next/close smoke test passed.');
