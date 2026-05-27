/**
 * Smart Closet Manager - Frontend Logic
 * Lógica modular con Vanilla JS para interactuar con la API REST de FastAPI
 */

// ================= ESTADO GLOBAL CLIENTE =================
const state = {
    items: [],
    stats: { total: 0, limpias: 0, sucias: 0 },
    filters: {
        category: 'all',
        status: 'all',
        search: ''
    },
    currentImageBase64: null,
    isEditing: false,
    editingId: null
};

// ================= REFERENCIAS DOM =================
const DOM = {
    closetGrid: document.getElementById('closet-grid'),
    statsPanel: document.getElementById('stats-panel'),
    statTotal: document.querySelector('#stat-total .stat-num'),
    statClean: document.querySelector('#stat-clean .stat-num'),
    statDirty: document.querySelector('#stat-dirty .stat-num'),
    
    // Controles
    btnOpenAddModal: document.getElementById('btn-open-add-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    searchInput: document.getElementById('search-input'),
    categoryTabs: document.getElementById('category-tabs'),
    statusTabs: document.getElementById('status-tabs'),
    
    // Modal & Formulario
    modal: document.getElementById('clothing-modal'),
    modalTitle: document.getElementById('modal-title'),
    form: document.getElementById('clothing-form'),
    formItemId: document.getElementById('form-item-id'),
    nameInput: document.getElementById('name-input'),
    categoryInput: document.getElementById('category-input'),
    statusInput: document.getElementById('status-input'),
    colorInput: document.getElementById('color-input'),
    colorHexVal: document.getElementById('color-hex-val'),
    
    // Zona de Imagen
    imageDropzone: document.getElementById('image-dropzone'),
    imageInput: document.getElementById('image-input'),
    dropzoneContent: document.getElementById('dropzone-content'),
    imagePreview: document.getElementById('image-preview'),
    btnRemoveImage: document.getElementById('btn-remove-image'),
    
    // Contenedores generales
    toastContainer: document.getElementById('toast-container')
};

// ================= SISTEMA DE TOASTS =================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Definición de icono SVG basado en el tipo
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
    
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Animación de salida automática tras 4 segundos
    setTimeout(() => {
        toast.style.animation = 'toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// ================= PETICIONES A LA API (BACKEND) =================

/**
 * Obtener estadísticas globales de las prendas
 */
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Error al obtener estadísticas');
        state.stats = await response.json();
        updateStatsUI();
    } catch (error) {
        console.error(error);
        showToast('No se pudieron actualizar las estadísticas', 'danger');
    }
}

/**
 * Obtener prendas filtradas desde la API
 */
async function fetchItems() {
    try {
        let url = '/api/items';
        const params = [];
        
        if (state.filters.category !== 'all') {
            params.push(`category=${encodeURIComponent(state.filters.category)}`);
        }
        if (state.filters.status !== 'all') {
            params.push(`status=${encodeURIComponent(state.filters.status)}`);
        }
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener prendas');
        state.items = await response.json();
        renderGrid();
    } catch (error) {
        console.error(error);
        showGridError();
    }
}

/**
 * Cambiar alternativamente el estado de Limpio/Sucio de una prenda
 */
async function toggleItemStatus(itemId, currentStatus) {
    const newStatus = currentStatus === 'Limpio' ? 'Sucio' : 'Limpio';
    try {
        const response = await fetch(`/api/items/${itemId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('No se pudo cambiar el estado');
        
        // Actualizar datos localmente
        const updatedItem = await response.json();
        state.items = state.items.map(item => item.id === itemId ? updatedItem : item);
        
        // Actualizar estadísticas y rediseñar la grilla sin parpadeos
        fetchStats();
        renderGrid();
        showToast(`Prenda marcada como ${newStatus.toLowerCase()}`, 'success');
    } catch (error) {
        console.error(error);
        showToast('Ocurrió un error al cambiar el estado de la prenda', 'danger');
    }
}

/**
 * Eliminar una prenda de vestir
 */
async function deleteItem(itemId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta prenda permanentemente?')) return;
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar prenda');
        
        state.items = state.items.filter(item => item.id !== itemId);
        fetchStats();
        renderGrid();
        showToast('Prenda eliminada exitosamente del clóset', 'success');
    } catch (error) {
        console.error(error);
        showToast('No se pudo eliminar la prenda', 'danger');
    }
}

// ================= RENDERIZADO DE INTERFAZ (UI) =================

function updateStatsUI() {
    DOM.statTotal.textContent = state.stats.total;
    DOM.statClean.textContent = state.stats.limpias;
    DOM.statDirty.textContent = state.stats.sucias;
}

function showGridError() {
    DOM.closetGrid.innerHTML = `
        <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>Fallo de Conexión</h3>
            <p>No se pudieron recuperar las prendas del servidor. Revisa si la base de datos está disponible.</p>
        </div>
    `;
}

function renderGrid() {
    const query = state.filters.search.toLowerCase().trim();
    
    // Filtrar prendas en el cliente si hay búsqueda por texto
    const filteredItems = state.items.filter(item => {
        return item.name.toLowerCase().includes(query);
    });
    
    // Estado vacío
    if (filteredItems.length === 0) {
        let emptyMessage = 'No tienes prendas guardadas en esta sección del clóset.';
        if (query) {
            emptyMessage = `No encontramos prendas que coincidan con "${query}".`;
        }
        
        DOM.closetGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                <h3>El Clóset está Vacío</h3>
                <p>${emptyMessage}</p>
                ${!query ? `<button class="btn btn-secondary" onclick="DOM.btnOpenAddModal.click()">Agregar mi primera prenda</button>` : ''}
            </div>
        `;
        return;
    }
    
    // Renderizar grilla
    DOM.closetGrid.innerHTML = filteredItems.map(item => {
        // Renderizar imagen de fondo o ícono por defecto
        const mediaHtml = item.image_base64 
            ? `<img class="card-image" src="${item.image_base64}" alt="${item.name}" loading="lazy">`
            : `<div class="card-placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <path d="M20.37 8.91l-8-1.78a1 1 0 0 0-.49 0l-8 1.78a1 1 0 0 0-.75.97v8.64a1 1 0 0 0 .75.97l8 1.78a1 1 0 0 0 .49 0l8-1.78a1 1 0 0 0 .75-.97v-8.64a1 1 0 0 0-.75-.97z"></path>
                    <polyline points="12 22 12 12 21 10"></polyline>
                    <polyline points="12 12 3 10"></polyline>
                </svg>
               </div>`;
               
        const isClean = item.status === 'Limpio';
        const toggleClass = isClean ? 'status-toggle-clean' : 'status-toggle-dirty';
        
        return `
            <article class="clothing-card" data-id="${item.id}">
                <div class="card-media">
                    ${mediaHtml}
                    <span class="card-badge">${translateCategory(item.category)}</span>
                    <div class="card-actions">
                        <button class="btn-icon btn-icon-edit" onclick="openEditModal(${item.id})" title="Editar prenda" aria-label="Editar prenda">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                        </button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteItem(${item.id})" title="Eliminar prenda" aria-label="Eliminar prenda">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-title-row">
                        <h3 class="card-title" title="${item.name}">${item.name}</h3>
                        ${item.color ? `<span class="card-color-dot" style="background-color: ${item.color};" title="Color de la prenda"></span>` : ''}
                    </div>
                    <div class="card-status-row">
                        <span class="status-label">Estado</span>
                        <button class="status-toggle ${toggleClass}" onclick="toggleItemStatus(${item.id}, '${item.status}')" title="Haga clic para cambiar estado">
                            <span class="toggle-bullet"></span>
                            <span>${item.status}</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function translateCategory(cat) {
    const map = {
        'Tops': 'Tops',
        'Bottoms': 'Pantalones',
        'Calzado': 'Calzado',
        'Accesorios': 'Accesorios'
    };
    return map[cat] || cat;
}

// ================= MANEJO DE IMÁGENES (BASE64) =================

/**
 * Leer archivo de imagen seleccionado y convertirlo a string Base64
 */
function handleImageSelect(file) {
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showToast('El archivo seleccionado debe ser una imagen', 'danger');
        return;
    }
    
    // Limitar peso para evitar que la base de datos crezca demasiado (máx 3.5MB para demo)
    if (file.size > 3.5 * 1024 * 1024) {
        showToast('Elige una imagen de menor peso (máximo 3.5MB) para ahorrar espacio', 'danger');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        state.currentImageBase64 = e.target.result;
        
        // Actualizar UI para mostrar vista previa
        DOM.imagePreview.src = state.currentImageBase64;
        DOM.imagePreview.classList.remove('hidden');
        DOM.dropzoneContent.classList.add('hidden');
        DOM.btnRemoveImage.classList.remove('hidden');
        
        showToast('Imagen cargada con éxito', 'info');
    };
    reader.readAsDataURL(file);
}

function resetImageUpload() {
    state.currentImageBase64 = null;
    DOM.imageInput.value = '';
    DOM.imagePreview.src = '';
    DOM.imagePreview.classList.add('hidden');
    DOM.dropzoneContent.classList.remove('hidden');
    DOM.btnRemoveImage.classList.add('hidden');
}

// ================= MODALES (AGREGAR / EDITAR) =================

function openAddModal() {
    state.isEditing = false;
    state.editingId = null;
    
    DOM.form.reset();
    DOM.formItemId.value = '';
    DOM.modalTitle.textContent = 'Agregar Nueva Prenda';
    DOM.colorHexVal.textContent = '#6366f1';
    DOM.colorInput.value = '#6366f1';
    resetImageUpload();
    
    DOM.modal.classList.add('active');
    DOM.nameInput.focus();
}

function openEditModal(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    
    state.isEditing = true;
    state.editingId = itemId;
    
    DOM.modalTitle.textContent = 'Editar Prenda';
    DOM.formItemId.value = item.id;
    DOM.nameInput.value = item.name;
    DOM.categoryInput.value = item.category;
    DOM.statusInput.value = item.status;
    DOM.colorInput.value = item.color || '#6366f1';
    DOM.colorHexVal.textContent = item.color || '#6366f1';
    
    // Cargar imagen
    if (item.image_base64) {
        state.currentImageBase64 = item.image_base64;
        DOM.imagePreview.src = item.image_base64;
        DOM.imagePreview.classList.remove('hidden');
        DOM.dropzoneContent.classList.add('hidden');
        DOM.btnRemoveImage.classList.remove('hidden');
    } else {
        resetImageUpload();
    }
    
    DOM.modal.classList.add('active');
    DOM.nameInput.focus();
}

function closeModal() {
    DOM.modal.classList.remove('active');
    DOM.form.reset();
    resetImageUpload();
}

// ================= SUBMIT DEL FORMULARIO (CRUD - CREATE/UPDATE) =================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = DOM.nameInput.value.trim();
    const category = DOM.categoryInput.value;
    const status = DOM.statusInput.value;
    const color = DOM.colorInput.value;
    
    if (!name || !category) {
        showToast('Por favor completa todos los campos requeridos', 'danger');
        return;
    }
    
    const payload = {
        name,
        category,
        status,
        color,
        image_base64: state.currentImageBase64
    };
    
    try {
        let response;
        if (state.isEditing) {
            response = await fetch(`/api/items/${state.editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar la prenda');
        
        showToast(
            state.isEditing ? 'Prenda actualizada correctamente' : 'Prenda agregada al clóset con éxito', 
            'success'
        );
        
        closeModal();
        fetchStats();
        fetchItems();
    } catch (error) {
        console.error(error);
        showToast('Ocurrió un error al guardar la prenda. Verifica el tamaño de la foto.', 'danger');
    }
}

// ================= EVENTOS Y LISTENERS =================

function initEvents() {
    // Abrir y Cerrar Modales
    DOM.btnOpenAddModal.addEventListener('click', openAddModal);
    DOM.btnCloseModal.addEventListener('click', closeModal);
    DOM.btnCancelModal.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer clic en el fondo oscuro
    DOM.modal.addEventListener('click', (e) => {
        if (e.target === DOM.modal) closeModal();
    });
    
    // Submit del Formulario
    DOM.form.addEventListener('submit', handleFormSubmit);
    
    // Sincronización visual del selector de color
    DOM.colorInput.addEventListener('input', (e) => {
        DOM.colorHexVal.textContent = e.target.value;
    });
    
    // Búsqueda instantánea en cliente
    DOM.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        renderGrid();
    });
    
    // Selección de pestañas de categorías
    DOM.categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        
        // Cambiar pestaña activa
        DOM.categoryTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        state.filters.category = tab.dataset.category;
        fetchItems();
    });
    
    // Selección de pestañas de estado
    DOM.statusTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        
        // Cambiar pestaña activa
        DOM.statusTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        state.filters.status = tab.dataset.status;
        fetchItems();
    });
    

    DOM.imageInput.addEventListener('change', (e) => {
        handleImageSelect(e.target.files[0]);
    });
    
    DOM.btnRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageUpload();
        showToast('Foto removida', 'info');
    });
    
    // Soporte para Drag & Drop de Imágenes en la Dropzone
    DOM.imageDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.imageDropzone.style.borderColor = 'var(--primary)';
        DOM.imageDropzone.style.background = 'rgba(99, 102, 241, 0.05)';
    });
    
    DOM.imageDropzone.addEventListener('dragleave', () => {
        DOM.imageDropzone.style.borderColor = 'var(--border-color)';
        DOM.imageDropzone.style.background = 'rgba(0, 0, 0, 0.2)';
    });
    
    DOM.imageDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.imageDropzone.style.borderColor = 'var(--border-color)';
        DOM.imageDropzone.style.background = 'rgba(0, 0, 0, 0.2)';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageSelect(e.dataTransfer.files[0]);
        }
    });
}

// Exponer funciones necesarias al objeto window para llamadas desde HTML dinámico
window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
window.toggleItemStatus = toggleItemStatus;
window.DOM = DOM;

// ================= INICIALIZACIÓN DE LA APP =================
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    fetchStats();
    fetchItems();
});
