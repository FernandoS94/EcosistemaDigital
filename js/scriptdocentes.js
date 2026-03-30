// Script de recursos docentes

// Hamburger menu
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            const isOpen = navMenu.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen);
        });

        // Cerrar al hacer click en un link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', false);
            });
        });
    }
});


const STATE = {
  resources: [],
  filtered: [],
  allSubjects: [],
  searchQuery: '',
  activeFilters: {
    level: new Set(),
    category: new Set(),
    subject: new Set(),
    mode: new Set()
  },
  PAGE_SIZE: 24,
  renderedCount: 0,
  isLoading: false
};

// ─────────────────────────────────────────────
//  Carga de recursos desde resources.json
// ─────────────────────────────────────────────
async function loadResources() {
  try {
    const response = await fetch('resources.json');
    if (!response.ok) throw new Error('Error al cargar recursos');
    STATE.resources = await response.json();
    init();
  } catch (error) {
    console.error(error);
    document.getElementById('resourcesGrid').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#e74c3c;">' +
      '<h3>⚠️ Error al cargar los recursos</h3><p>Por favor, recargá la página.</p></div>';
  }
}

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
function init() {
  buildFilters();

  // Mostrar todos los recursos al cargar con scroll infinito
  STATE.filtered = STATE.resources;
  STATE.renderedCount = 0;
  renderBatch(true);
  document.getElementById('resultsCount').textContent =
    STATE.resources.length + ' recursos';

  window.addEventListener('scroll', onScroll, { passive: true });

  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('subjectSearchWrapper');
    if (wrapper && !wrapper.contains(e.target)) closeSubjectDropdown();
  });
}

// ─────────────────────────────────────────────
//  Filtros — chips (nivel, espacio, modalidad)
// ─────────────────────────────────────────────
function buildFilters() {
  const unique = (key) =>
    [...new Set(STATE.resources.flatMap(r => splitValues(r[key])))].sort();

  STATE.allSubjects = unique('subject');

  renderChips('levelChips',    unique('level'),    'level');
  renderChips('categoryChips', unique('category'), 'category', 'category-chip');
  renderChips('modeChips',     unique('mode').filter(Boolean), 'mode', 'mode-chip');
  buildSubjectDropdown('');
}

function renderChips(containerId, values, filterType, extraClass = '') {
  const container = document.getElementById(containerId);
  // Construir todo el DOM de una sola vez con fragment
  const fragment = document.createDocumentFragment();
  values.forEach(v => {
    const chip = document.createElement('div');
    chip.className = 'chip ' + extraClass;
    chip.textContent = v;
    chip.dataset.value = v;
    chip.dataset.filter = filterType;
    chip.addEventListener('click', () => toggleChip(chip, filterType, v));
    fragment.appendChild(chip);
  });
  container.appendChild(fragment);
}

function toggleChip(chipEl, filterType, value) {
  if (STATE.activeFilters[filterType].has(value)) {
    STATE.activeFilters[filterType].delete(value);
    chipEl.classList.remove('active');
  } else {
    STATE.activeFilters[filterType].add(value);
    chipEl.classList.add('active');
  }
  applyFilters();
}

// ─────────────────────────────────────────────
//  Filtros — buscador de materias
// ─────────────────────────────────────────────
function buildSubjectDropdown(query) {
  const dropdown = document.getElementById('subjectDropdown');
  if (!dropdown) return;

  const filtered = query
    ? STATE.allSubjects.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : STATE.allSubjects;

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="subject-dropdown-empty">Sin resultados</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach(subject => {
    const isSelected = STATE.activeFilters.subject.has(subject);
    const item = document.createElement('div');
    item.className = 'subject-dropdown-item' + (isSelected ? ' selected' : '');
    item.innerHTML =
      '<span class="item-check">' + (isSelected ? '✓' : '') + '</span>' +
      '<span>' + subject + '</span>';
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSubjectFilter(subject);
    });
    fragment.appendChild(item);
  });

  dropdown.innerHTML = '';
  dropdown.appendChild(fragment);
}

function openSubjectDropdown() {
  buildSubjectDropdown(document.getElementById('subjectSearchInput').value);
  document.getElementById('subjectDropdown').classList.add('open');
}

function closeSubjectDropdown() {
  document.getElementById('subjectDropdown')?.classList.remove('open');
}

function filterSubjectDropdown() {
  buildSubjectDropdown(document.getElementById('subjectSearchInput').value);
  document.getElementById('subjectDropdown').classList.add('open');
}

function toggleSubjectFilter(subject) {
  if (STATE.activeFilters.subject.has(subject)) {
    STATE.activeFilters.subject.delete(subject);
  } else {
    STATE.activeFilters.subject.add(subject);
  }
  buildSubjectDropdown(document.getElementById('subjectSearchInput').value);
  renderSelectedSubjectChips();
  applyFilters();
}

function renderSelectedSubjectChips() {
  const container = document.getElementById('subjectChips');
  if (!container) return;
  const fragment = document.createDocumentFragment();
  STATE.activeFilters.subject.forEach(subject => {
    const chip = document.createElement('div');
    chip.className = 'chip subject-chip active';
    chip.innerHTML =
      subject +
      ' <span style="margin-left:5px;opacity:.7;font-weight:700;cursor:pointer"' +
      ' data-subject="' + subject + '">×</span>';
    chip.querySelector('span').addEventListener('click', () => toggleSubjectFilter(subject));
    fragment.appendChild(chip);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
}

// ─────────────────────────────────────────────
//  Tags activos (resumen debajo de los filtros)
// ─────────────────────────────────────────────
function updateActiveTags() {
  const footer = document.getElementById('filtersFooter');
  const container = document.getElementById('activeFilterTags');

  const allActive = [
    ...Array.from(STATE.activeFilters.level).map(v    => ({ type: 'level',    value: v })),
    ...Array.from(STATE.activeFilters.category).map(v => ({ type: 'category', value: v })),
    ...Array.from(STATE.activeFilters.subject).map(v  => ({ type: 'subject',  value: v })),
    ...Array.from(STATE.activeFilters.mode).map(v     => ({ type: 'mode',     value: v }))
  ];

  if (allActive.length === 0) {
    footer.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  footer.style.display = 'flex';
  const fragment = document.createDocumentFragment();
  allActive.forEach(f => {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag';
    tag.innerHTML = f.value + ' <span class="remove-filter">×</span>';
    tag.querySelector('.remove-filter').addEventListener('click', () => removeFilter(f.type, f.value));
    fragment.appendChild(tag);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
}

function removeFilter(filterType, value) {
  STATE.activeFilters[filterType].delete(value);

  if (filterType === 'subject') {
    renderSelectedSubjectChips();
    buildSubjectDropdown(document.getElementById('subjectSearchInput').value);
  } else {
    document.querySelectorAll(
      `.chip[data-filter="${filterType}"][data-value="${CSS.escape(value)}"]`
    ).forEach(c => c.classList.remove('active'));
  }
  applyFilters();
}


// ─────────────────────────────────────────────
//  Búsqueda global
// ─────────────────────────────────────────────
function onGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const clear  = document.getElementById('globalSearchClear');
  STATE.searchQuery = normalize(input.value.trim());
  clear.style.display = STATE.searchQuery ? 'flex' : 'none';
  applyFilters();
}

function clearGlobalSearch() {
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('globalSearchClear').style.display = 'none';
  STATE.searchQuery = '';
  applyFilters();
}

// ─────────────────────────────────────────────
//  Lógica de filtrado
// ─────────────────────────────────────────────
function splitValues(value) {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

// Normaliza texto: minúsculas + sin tildes
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesFilter(resourceValue, filterSet) {
  if (filterSet.size === 0) return true;
  return splitValues(resourceValue).some(v => filterSet.has(v));
}

function applyFilters() {
  const { activeFilters, resources } = STATE;
  const hasActive =
    activeFilters.level.size > 0 || activeFilters.category.size > 0 ||
    activeFilters.subject.size > 0 || activeFilters.mode.size > 0;

  updateActiveTags();

  if (!hasActive) {
    const q = STATE.searchQuery;
    STATE.filtered = q
      ? resources.filter(r =>
          normalize(r.title).includes(q)       ||
          normalize(r.description).includes(q) ||
          normalize(r.subject).includes(q)     ||
          r.tags.some(t => normalize(t).includes(q))
        )
      : resources;
    STATE.renderedCount = 0;
    renderBatch(true);
    const count = STATE.filtered.length;
    document.getElementById('resultsCount').textContent =
      q ? count + ' de ' + resources.length + ' recursos' : resources.length + ' recursos';
    return;
  }

  const q = STATE.searchQuery;
  STATE.filtered = resources.filter(r => {
    const matchesChips =
      matchesFilter(r.level,    activeFilters.level)    &&
      matchesFilter(r.category, activeFilters.category) &&
      matchesFilter(r.subject,  activeFilters.subject)  &&
      matchesFilter(r.mode,     activeFilters.mode);
    if (!matchesChips) return false;
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q)       ||
      r.description.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)     ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  STATE.renderedCount = 0;
  renderBatch(true); // primer batch, reemplaza grid
  document.getElementById('resultsCount').textContent =
    STATE.filtered.length + ' de ' + resources.length + ' recursos';
}

// ─────────────────────────────────────────────
//  Renderizado por lotes (scroll infinito)
// ─────────────────────────────────────────────
function renderBatch(reset = false) {
  const grid = document.getElementById('resourcesGrid');
  const noResults = document.getElementById('noResults');
  const { filtered, PAGE_SIZE } = STATE;

  if (reset) {
    grid.innerHTML = '';
    grid.style.display = 'grid';
    noResults.style.display = 'none';
  }

  if (filtered.length === 0) {
    noResults.style.display = 'block';
    grid.style.display = 'none';
    return;
  }

  const slice = filtered.slice(STATE.renderedCount, STATE.renderedCount + PAGE_SIZE);
  if (slice.length === 0) return;

  const fragment = document.createDocumentFragment();
  slice.forEach(resource => {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = cardHTML(resource);
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
  STATE.renderedCount += slice.length;
}

function cardHTML(r) {
  const tagsHtml = r.tags.map(t => '<span class="tag">' + t + '</span>').join('');
  const modeTag  = r.mode ? '<span class="tag mode">' + r.mode + '</span>' : '';
  return (
    '<div class="resource-header">' +
      '<span class="resource-level">' + r.level + '</span>' +
      '<h3 class="resource-title">' + r.title + '</h3>' +
    '</div>' +
    '<div class="resource-meta">' +
      '<p class="resource-description">' + r.description + '</p>' +
      '<div class="resource-tags">' +
        '<span class="tag category">' + r.category + '</span>' +
        '<span class="tag subject">' + r.subject + '</span>' +
        modeTag + tagsHtml +
      '</div>' +
    '</div>' +
    '<div class="resource-actions">' +
      '<button class="btn-view-pdf"' +
        ' data-clarity-mask="false"' +
        ' data-resource-id="'      + r.id       + '"' +
        ' data-resource-title="'   + r.title.replace(/"/g, '&quot;') + '"' +
        ' data-resource-subject="' + r.subject.replace(/"/g, '&quot;') + '"' +
        ' data-resource-level="'   + r.level.replace(/"/g, '&quot;') + '"' +
        ' data-resource-category="'+ r.category.replace(/"/g, '&quot;') + '"' +
        ' onclick="redirectToMaterial(\'' + r.url + '\')">Ver Material</button>' +
    '</div>'
  );
}

// ─────────────────────────────────────────────
//  Scroll infinito
// ─────────────────────────────────────────────
function onScroll() {
  if (STATE.isLoading) return;
  if (STATE.renderedCount >= STATE.filtered.length) return;

  const scrollBottom = window.innerHeight + window.scrollY;
  const docHeight    = document.documentElement.scrollHeight;

  if (scrollBottom >= docHeight - 300) {
    STATE.isLoading = true;
    // requestAnimationFrame para no bloquear el hilo principal
    requestAnimationFrame(() => {
      renderBatch();
      STATE.isLoading = false;
    });
  }
}

// ─────────────────────────────────────────────
//  Estado vacío
// ─────────────────────────────────────────────
function showEmptyState() {
  const grid = document.getElementById('resourcesGrid');
  const noResults = document.getElementById('noResults');
  noResults.style.display = 'none';
  grid.style.display = 'grid';
  grid.innerHTML =
    '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#aaa;">' +
      '<div style="font-size:2.5rem;margin-bottom:16px;">🔍</div>' +
      '<h3 style="color:var(--secondary-color);font-size:1.2rem;margin-bottom:8px;">' +
        'Seleccioná un filtro para ver los recursos' +
      '</h3>' +
      '<p style="font-size:0.95rem;">' +
        'Usá los filtros de arriba para encontrar materiales por nivel, espacio, materia o modalidad.' +
      '</p>' +
    '</div>';
}

// ─────────────────────────────────────────────
//  Reset
// ─────────────────────────────────────────────
function resetFilters() {
  Object.keys(STATE.activeFilters).forEach(k => STATE.activeFilters[k].clear());

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  const subjectChips = document.getElementById('subjectChips');
  if (subjectChips) subjectChips.innerHTML = '';
  document.getElementById('subjectSearchInput').value = '';
  buildSubjectDropdown('');

  // Limpiar búsqueda global
  STATE.searchQuery = '';
  const globalInput = document.getElementById('globalSearchInput');
  if (globalInput) globalInput.value = '';
  const globalClear = document.getElementById('globalSearchClear');
  if (globalClear) globalClear.style.display = 'none';

  updateActiveTags();
  STATE.filtered = STATE.resources;
  STATE.renderedCount = 0;
  renderBatch(true);
  document.getElementById('resultsCount').textContent =
    STATE.resources.length + ' recursos';
}

// ─────────────────────────────────────────────
//  Utils
// ─────────────────────────────────────────────
function redirectToMaterial(url) {
  window.open(url, '_blank');
}

function toggleFaq(element) {
  element.classList.toggle('active');
}

window.onload = loadResources;