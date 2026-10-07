import { readFileSync } from 'node:fs';
import { visit } from 'unist-util-visit';

// Warranty labor rate lookup for the blog. A post drops in
// <div data-state-rate-lookup></div> and this plugin swaps it for a state
// picker built from src/data/warranty-rate-states.json.
//
// Every state's card is rendered into the HTML at build time, so all 50
// states are crawlable text. The inline script only shows the chosen card;
// without JS, every card stays visible.

const DATA_URL = new URL('../data/warranty-rate-states.json', import.meta.url);

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const slug = (s) => `state-${s.abbr.toLowerCase()}`;

function fact(label, value) {
  return `<div class="px-5 py-4 border-t border-gray-200">
        <dt class="text-xs font-semibold tracking-wider uppercase text-gray-500">${esc(label)}</dt>
        <dd class="mt-1 text-navy">${esc(value)}</dd>
      </div>`;
}

function card(s) {
  const partial = s.standard === 'partial' && s.standardNote
    ? `<p class="px-5 py-3 text-sm text-gray-600 border-t border-gray-200"><span class="font-semibold text-navy">Manufacturer can push back:</span> ${esc(s.standardNote)}</p>`
    : '';
  return `<article id="${slug(s)}" data-srl-card class="rounded-lg border border-gray-200 bg-white overflow-hidden scroll-mt-28">
    <div class="bg-navy px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-white text-xl font-bold m-0">${esc(s.state)}</h3>
      <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="text-teal-light text-sm underline">${esc(s.citation)}</a>
    </div>
    <dl class="grid grid-cols-1 sm:grid-cols-2 m-0">
      ${fact('Labor rate', s.labor)}
      ${fact('Parts markup', s.parts)}
      ${fact('How often you can file', s.frequency)}
      ${fact('Manufacturer response', s.response)}
    </dl>
    ${partial}
  </article>`;
}

function render(states, asOf) {
  const options = states.map((s) => `<option value="${slug(s)}">${esc(s.state)}</option>`).join('');
  const links = states
    .map((s) => `<a href="#${slug(s)}" class="block rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-navy hover:border-teal no-underline">${esc(s.state)}</a>`)
    .join('');
  return `<div id="state-rate-lookup" class="not-prose my-10 rounded-xl border border-gray-200 bg-surface p-5 md:p-7">
  <p class="text-xs font-semibold tracking-widest uppercase text-teal mb-2">Look up your state</p>
  <label for="srl-select" class="block text-lg font-bold text-navy mb-3">Warranty labor rate rules, all 50 states</label>
  <select id="srl-select" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-navy font-semibold focus:outline-none focus:ring-2 focus:ring-teal">
    <option value="">Choose your state</option>${options}
  </select>
  <div class="mt-4 grid gap-4">
    <p data-srl-empty hidden class="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600 m-0">Choose a state to see how its statute sets your warranty labor rate and parts markup, how often you can file, and how long the manufacturer has to respond.</p>
    ${states.map(card).join('\n    ')}
  </div>
  <details class="mt-4">
    <summary class="cursor-pointer text-sm font-semibold text-teal">All states</summary>
    <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">${links}</div>
  </details>
  <p class="mt-4 mb-0 text-xs text-gray-500">Read from each state's statute, ${esc(asOf)}. Statutes get amended, so confirm against the current text before you file. This is a reference, not legal advice.</p>
</div>
<script>
(() => {
  const root = document.getElementById('state-rate-lookup');
  if (!root) return;
  const select = root.querySelector('#srl-select');
  const empty = root.querySelector('[data-srl-empty]');
  const cards = [...root.querySelectorAll('[data-srl-card]')];
  function show(id, scroll) {
    const match = cards.find((c) => c.id === id);
    cards.forEach((c) => { c.hidden = c !== match; });
    empty.hidden = !!match;
    select.value = match ? id : '';
    if (match && scroll) match.scrollIntoView({ block: 'nearest' });
  }
  select.addEventListener('change', () => {
    show(select.value, false);
    history.replaceState(null, '', select.value ? '#' + select.value : location.pathname);
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  show(location.hash.slice(1), !!location.hash);
})();
</script>`;
}

export function rehypeStateRateLookup() {
  return (tree) => {
    // Raw HTML in markdown reaches rehype as an unparsed 'raw' node.
    visit(tree, 'raw', (node, index, parent) => {
      if (!parent || !/<div data-state-rate-lookup><\/div>/.test(node.value)) return;
      const { asOf, states } = JSON.parse(readFileSync(DATA_URL, 'utf8'));
      parent.children[index] = { type: 'raw', value: render(states, asOf) };
    });
  };
}
