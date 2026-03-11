let resources = [];

async function loadResources() {
    try {
        const response = await fetch('resources.json');
        if (!response.ok) throw new Error('No se pudieron cargar los recursos');
        resources = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error al cargar recursos:', error);
        document.getElementById('resourcesGrid').innerHTML =
            '<div style="text-align:center;padding:40px;color:#e74c3c;"><h3>⚠️ Error al cargar los recursos</h3><p>Por favor, recarga la página.</p></div>';
    }
}

// Función para inicializar la aplicación
function initializeApp() {
    initializeChips();
    renderResources(resources);
    updateResultsCount(resources.length, resources.length);
}

// Estado de filtros
let activeFilters = {
    level: new Set(),
    category: new Set(),
    subject: new Set(),
    mode: new Set()
};

// Función helper para dividir valores múltiples (separados por coma)
function splitMultipleValues(value) {
    if (!value) return [];
    return value.split(',').map(v => v.trim()).filter(v => v);
}

// Función helper para verificar si un recurso coincide con el filtro
function resourceMatchesFilter(resourceValue, activeFilterSet) {
    if (activeFilterSet.size === 0) return true;

    // Dividir el valor del recurso por comas
    const resourceValues = splitMultipleValues(resourceValue);

    // El recurso coincide si ALGUNO de sus valores está en el filtro activo
    return resourceValues.some(val => activeFilterSet.has(val));
}

// Inicializar chips
function initializeChips() {
    const levelContainer = document.getElementById('levelChips');
    const categoryContainer = document.getElementById('categoryChips');
    const subjectContainer = document.getElementById('subjectChips');
    const modeContainer = document.getElementById('modeChips');

    // Limpiar contenedores
    levelContainer.innerHTML = '';
    categoryContainer.innerHTML = '';
    subjectContainer.innerHTML = '';
    modeContainer.innerHTML = '';

    // Obtener valores únicos (dividiendo los valores múltiples)
    const allLevels = resources.flatMap(r => splitMultipleValues(r.level));
    const allCategories = resources.flatMap(r => splitMultipleValues(r.category));
    const allSubjects = resources.flatMap(r => splitMultipleValues(r.subject));
    const allModes = resources.flatMap(r => splitMultipleValues(r.mode));

    const uniqueLevels = [...new Set(allLevels)].sort();
    const uniqueCategories = [...new Set(allCategories)].sort();
    const uniqueSubjects = [...new Set(allSubjects)].sort();
    const uniqueModes = [...new Set(allModes)].filter(Boolean).sort();

    uniqueLevels.forEach(level => {
        const chip = createChip(level, 'level');
        levelContainer.appendChild(chip);
    });

    uniqueCategories.forEach(category => {
        const chip = createChip(category, 'category', 'category-chip');
        categoryContainer.appendChild(chip);
    });

    uniqueSubjects.forEach(subject => {
        const chip = createChip(subject, 'subject', 'subject-chip');
        subjectContainer.appendChild(chip);
    });

    uniqueModes.forEach(mode => {
        const chip = createChip(mode, 'mode', 'mode-chip');
        modeContainer.appendChild(chip);
    });
}

// Crear chip individual
function createChip(value, filterType, extraClass = '') {
    const chip = document.createElement('div');
    chip.className = `chip ${extraClass}`;
    chip.textContent = value;
    chip.onclick = () => toggleFilter(filterType, value, chip);
    return chip;
}

// Toggle filtro
function toggleFilter(filterType, value, chipElement) {
    if (activeFilters[filterType].has(value)) {
        activeFilters[filterType].delete(value);
        chipElement.classList.remove('active');
    } else {
        activeFilters[filterType].add(value);
        chipElement.classList.add('active');
    }
    updateActiveFilters();
    filterResources();
}

// Actualizar visualización de filtros activos
function updateActiveFilters() {
    const footer = document.getElementById('filtersFooter');
    const tagsContainer = document.getElementById('activeFilterTags');
    tagsContainer.innerHTML = '';

    const allFilters = [
        ...Array.from(activeFilters.level).map(v => ({ type: 'level', value: v, label: v })),
        ...Array.from(activeFilters.category).map(v => ({ type: 'category', value: v, label: v })),
        ...Array.from(activeFilters.subject).map(v => ({ type: 'subject', value: v, label: v })),
        ...Array.from(activeFilters.mode).map(v => ({ type: 'mode', value: v, label: v }))
    ];

    if (allFilters.length > 0) {
        footer.style.display = 'flex';
        allFilters.forEach(filter => {
            const tag = document.createElement('div');
            tag.className = 'active-filter-tag';
            tag.innerHTML = `
                ${filter.label}
                <span class="remove-filter" onclick="removeFilter('${filter.type}', '${filter.value}')">×</span>
            `;
            tagsContainer.appendChild(tag);
        });
    } else {
        footer.style.display = 'none';
    }
}

// Remover filtro individual
function removeFilter(filterType, value) {
    activeFilters[filterType].delete(value);

    // Actualizar chip visual
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        if (chip.textContent === value) {
            chip.classList.remove('active');
        }
    });

    updateActiveFilters();
    filterResources();
}

// Filtrar recursos
function filterResources() {
    const hasActiveFilters =
        activeFilters.level.size > 0 ||
        activeFilters.category.size > 0 ||
        activeFilters.subject.size > 0 ||
        activeFilters.mode.size > 0;

    let filtered = resources;

    if (hasActiveFilters) {
        filtered = resources.filter(resource => {
            const levelMatch = resourceMatchesFilter(resource.level, activeFilters.level);
            const categoryMatch = resourceMatchesFilter(resource.category, activeFilters.category);
            const subjectMatch = resourceMatchesFilter(resource.subject, activeFilters.subject);
            const modeMatch = resourceMatchesFilter(resource.mode, activeFilters.mode);
            return levelMatch && categoryMatch && subjectMatch && modeMatch;
        });
    }

    renderResources(filtered);
    updateResultsCount(filtered.length, resources.length);
}

// Actualizar contador de resultados
function updateResultsCount(filtered, total) {
    const countElement = document.getElementById('resultsCount');
    if (activeFilters.level.size > 0 || activeFilters.category.size > 0 || activeFilters.subject.size > 0 || activeFilters.mode.size > 0) {
        countElement.textContent = `${filtered} de ${total}`;
    } else {
        countElement.textContent = `${total} recursos`;
    }
}

// Renderizar recursos
function renderResources(data) {
    const grid = document.getElementById('resourcesGrid');
    const noResults = document.getElementById('noResults');

    grid.innerHTML = '';

    if (data.length === 0) {
        noResults.style.display = 'block';
        grid.style.display = 'none';
        return;
    } else {
        noResults.style.display = 'none';
        grid.style.display = 'grid';
    }

    data.forEach(resource => {
        const tagsHtml = resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        const cardHtml = `
            <div class="resource-card">
                <div class="resource-header">
                    <span class="resource-level">${resource.level}</span>
                    <h3 class="resource-title">${resource.title}</h3>
                </div>
                <div class="resource-meta">
                    <p class="resource-description">${resource.description}</p>
                    <div class="resource-tags">
                        <span class="tag category">${resource.category}</span>
                        <span class="tag subject">${resource.subject}</span>
                        ${resource.mode ? `<span class="tag mode">${resource.mode}</span>` : ''}
                        ${tagsHtml}
                    </div>
                </div>
                <div class="resource-actions">
                    <button class="btn-view-pdf" onclick="redirectToMaterial('${resource.url}')">Ver Material</button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });
}

// Reiniciar filtros
function resetFilters() {
    activeFilters.level.clear();
    activeFilters.category.clear();
    activeFilters.subject.clear();
    activeFilters.mode.clear();

    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.remove('active');
    });

    updateActiveFilters();
    filterResources();
}

// Redirigir a material
function redirectToMaterial(url) {
    window.open(url, '_blank');
}

// Toggle FAQ
function toggleFaq(element) {
    element.classList.toggle('active');
}



// Inicializar aplicación cargando recursos
window.onload = loadResources;