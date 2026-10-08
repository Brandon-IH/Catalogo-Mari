/**
 * KRONOS ENTERPRISE ENGINE
 * Importación Dinámica desde src/data/products.js, Sanitización DOM Anti-XSS y Scroll Restoration
 */

import { CATALOGO_KRONOS } from './src/data/products.js';

document.addEventListener('DOMContentLoaded', () => {
    // Carga e higienización inicial del catálogo estático
    const products = CATALOGO_KRONOS.map(p => ({
        ...p,
        images: p.images && p.images.length > 0 ? p.images : ['assets/images/placeholder.webp'],
        sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['Unitalla']
    }));

    // Estado Interno
    let currentGender = 'all';
    let currentCategory = 'all';
    let lastScrollPosition = 0;
    let lastSelectedProductId = null;
    let selectedSizeForCurrentProduct = null;

    // Referencias DOM
    const homeView = document.getElementById('home-view');
    const detailView = document.getElementById('detail-view');
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const genderFilterButtons = document.querySelectorAll('.gender-btn');
    const categoryFilterButtons = document.querySelectorAll('.category-btn');
    const noResults = document.getElementById('noResults');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const brandLogo = document.getElementById('brand-logo');
    const btnBackCatalog = document.getElementById('btn-back-catalog');
    const btnCloseDetail = document.getElementById('btn-close-detail');

    /* ==========================================
       1. SEGURIDAD Y RESOLUCIÓN DE RUTA DE IMAGEN
    ========================================== */

    function getSecureImageUrl(url) {
        if (!url || typeof url !== 'string') return 'assets/images/placeholder.webp';
        
        let normalized = url.trim().replace(/\\/g, '/');

        if (normalized.toLowerCase().startsWith('javascript:') || normalized.toLowerCase().startsWith('data:text/html')) {
            return 'assets/images/placeholder.webp';
        }

        if (normalized.startsWith('https://') || normalized.startsWith('http://')) {
            return normalized;
        }

        if (normalized.startsWith('/')) {
            normalized = normalized.substring(1);
        }

        if (normalized.includes('assets/images/')) {
            normalized = 'assets/images/' + normalized.split('assets/images/')[1];
        }

        return normalized;
    }

    /* ==========================================
       2. NAVEGACIÓN Y RESTAURACIÓN DE SCROLL
    ========================================== */

    function openDetailView(productId, pushHistory = true) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        lastScrollPosition = window.scrollY;
        lastSelectedProductId = productId;
        selectedSizeForCurrentProduct = null;

        populateDetailView(product);
        homeView.classList.add('view-hidden');
        detailView.classList.remove('view-hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (pushHistory) {
            history.pushState({ view: 'detail', productId, scrollPos: lastScrollPosition }, '', `#producto-${productId}`);
        }
    }

    function goBackToCatalog() {
        if (window.history.state && window.history.state.view === 'detail') {
            window.history.back();
        } else {
            showHomeView(true);
        }
    }

    function showHomeView(pushHistory = false) {
        detailView.classList.add('view-hidden');
        homeView.classList.remove('view-hidden');

        if (pushHistory) {
            history.pushState({ view: 'home' }, '', '#catalogo');
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: lastScrollPosition, behavior: 'instant' });
                highlightLastProduct();
            });
        });
    }

    function highlightLastProduct() {
        if (!lastSelectedProductId) return;
        const targetCard = document.querySelector(`[data-product-id="${lastSelectedProductId}"]`);
        if (targetCard) {
            targetCard.classList.add('card-highlight');
            setTimeout(() => targetCard.classList.remove('card-highlight'), 1800);
        }
    }

    function navigateToSection(sectionId) {
        if (!detailView.classList.contains('view-hidden')) {
            showHomeView(false);
        }

        setTimeout(() => {
            if (sectionId === 'inicio') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const section = document.getElementById(sectionId);
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 50);
    }

    /* ==========================================
       3. RENDERIZADO CON SANITIZACIÓN DOM SEGURA
    ========================================== */

    function renderProducts(filterText = '') {
        const query = filterText.toLowerCase();

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(query) || 
                                 p.desc.toLowerCase().includes(query) ||
                                 p.gender.toLowerCase().includes(query) ||
                                 p.category.toLowerCase().includes(query);

            const matchesGender = currentGender === 'all' || p.gender === currentGender || p.gender === 'Unisex';
            const matchesCategory = currentCategory === 'all' || p.category === currentCategory;

            return matchesSearch && matchesGender && matchesCategory;
        });

        productGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
            const fragment = document.createDocumentFragment();

            filtered.forEach(p => {
                const card = document.createElement('div');
                card.className = "product-card bg-obsidian-950 text-white rounded-[2.5rem] overflow-hidden border border-gold-500/20 group flex flex-col h-full cursor-pointer relative shadow-xl";
                card.setAttribute('data-product-id', p.id);

                const coverImg = getSecureImageUrl(p.images && p.images.length > 0 ? p.images[0] : '');
                const sizesList = p.sizes || ["Unitalla"];
                const sizesBadgesHTML = sizesList.slice(0, 5).map(s => `<span class="size-pill-card">${s}</span>`).join('');
                const extraSizesCount = sizesList.length > 5 ? `<span class="size-pill-card">+${sizesList.length - 5}</span>` : '';

                card.innerHTML = `
                    <div class="product-card-image-box border-b border-white/5">
                        <img src="${coverImg}" alt="" loading="lazy" decoding="async" width="800" height="600">
                        
                        <div class="absolute top-5 right-5 flex flex-col items-end gap-1.5 z-10 font-sans">
                            <span class="bg-gold-500 text-obsidian-950 text-[9px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-xl">${p.gender}</span>
                            <span class="bg-obsidian-900/90 backdrop-blur text-stone-200 text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10">${p.category}</span>
                        </div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="font-bold font-editorial italic text-2xl mb-2 text-stone-100 tracking-tight"></h3>
                        <p class="text-stone-300 text-xs mb-4 leading-relaxed font-normal line-clamp-2 font-sans"></p>
                        
                        <div class="flex items-center gap-1.5 mb-6 overflow-x-auto no-scrollbar font-sans">
                            <span class="text-[8px] font-bold uppercase tracking-widest text-stone-500 mr-1">Tallas:</span>
                            ${sizesBadgesHTML}
                            ${extraSizesCount}
                        </div>

                        <div class="mt-auto flex justify-between items-center pt-4 border-t border-white/10 font-sans">
                            <div class="flex flex-col">
                                <span class="text-[9px] uppercase font-bold text-stone-400 tracking-[0.2em]">Precio</span>
                                <span class="price-tag text-2xl font-bold text-gold-500"></span>
                            </div>
                            <div class="bg-white/10 text-gold-500 w-12 h-12 rounded-2xl group-hover:bg-gold-500 group-hover:text-obsidian-950 transition-all shadow-md flex items-center justify-center border border-gold-500/30">
                                <i class="fas fa-arrow-right text-sm"></i>
                            </div>
                        </div>
                    </div>
                `;

                // Sanitización estricta por manipulación directa de nodos del DOM
                const imgEl = card.querySelector('img');
                imgEl.alt = p.name;
                imgEl.onerror = () => { imgEl.src = 'assets/images/placeholder.webp'; };

                card.querySelector('h3').textContent = p.name;
                card.querySelector('p').textContent = p.desc;
                card.querySelector('.price-tag').textContent = `$${p.price.toLocaleString()}`;

                card.addEventListener('click', () => {
                    openDetailView(p.id);
                });

                fragment.appendChild(card);
            });

            productGrid.appendChild(fragment);
        }
    }

    function populateDetailView(product) {
        const detailImg = document.getElementById('detail-img');
        const thumbnailsContainer = document.getElementById('detail-thumbnails');
        const sizesContainer = document.getElementById('detail-sizes-container');
        const sizeLabel = document.getElementById('selected-size-label');

        const imagesList = product.images && product.images.length > 0 ? product.images : ['assets/images/placeholder.webp'];
        
        detailImg.src = getSecureImageUrl(imagesList[0]);
        detailImg.alt = product.name;
        detailImg.onerror = () => { detailImg.src = 'assets/images/placeholder.webp'; };

        thumbnailsContainer.innerHTML = '';
        
        if (imagesList.length > 1) {
            imagesList.forEach((imgUrl, idx) => {
                const thumbBox = document.createElement('div');
                thumbBox.className = `thumbnail-box ${idx === 0 ? 'active' : ''}`;
                
                const safeUrl = getSecureImageUrl(imgUrl);
                thumbBox.innerHTML = `<img src="${safeUrl}" alt="Vista ${idx + 1}">`;

                thumbBox.addEventListener('click', () => {
                    detailImg.style.opacity = '0';
                    setTimeout(() => {
                        detailImg.src = safeUrl;
                        detailImg.style.opacity = '1';
                    }, 150);

                    thumbnailsContainer.querySelectorAll('.thumbnail-box').forEach(b => b.classList.remove('active'));
                    thumbBox.classList.add('active');
                });

                thumbnailsContainer.appendChild(thumbBox);
            });
            thumbnailsContainer.classList.remove('hidden');
        } else {
            thumbnailsContainer.classList.add('hidden');
        }

        sizesContainer.innerHTML = '';
        const sizes = product.sizes || ["Unitalla"];
        selectedSizeForCurrentProduct = null;
        sizeLabel.textContent = 'Selecciona una opción';

        sizes.forEach(sz => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'size-pill-detail';
            pill.textContent = sz;

            pill.addEventListener('click', () => {
                sizesContainer.querySelectorAll('.size-pill-detail').forEach(b => b.classList.remove('active'));
                pill.classList.add('active');
                selectedSizeForCurrentProduct = sz;
                sizeLabel.textContent = `Talla seleccionada: ${sz}`;
                updateWhatsAppLink(product);
            });

            sizesContainer.appendChild(pill);
        });

        document.getElementById('detail-gender').textContent = product.gender;
        document.getElementById('detail-category').textContent = product.category;
        document.getElementById('detail-name').textContent = product.name;
        document.getElementById('detail-price').textContent = `$${product.price.toLocaleString()}`;
        document.getElementById('detail-desc').textContent = product.desc;
        
        updateWhatsAppLink(product);
    }

    function updateWhatsAppLink(product) {
        const sizeText = selectedSizeForCurrentProduct 
            ? `en TALLA [${selectedSizeForCurrentProduct}]` 
            : `(Talla por confirmar)`;

        const waMsg = encodeURIComponent(`¡Hola KRONOS! Me interesa consultar disponibilidad de "${product.name}" (${product.gender} - ${product.category}) ${sizeText}.`);
        document.getElementById('whatsapp-link').href = `https://wa.me/523334821147?text=${waMsg}`;
    }

    /* ==========================================
       4. LISTENERS DE EVENTOS Y BÚSQUEDA
    ========================================== */

    document.querySelectorAll('[data-nav-section]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            navigateToSection(e.currentTarget.getAttribute('data-nav-section'));
            if (!mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden');
        });
    });

    brandLogo.addEventListener('click', () => navigateToSection('inicio'));
    mobileToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    btnBackCatalog.addEventListener('click', goBackToCatalog);
    btnCloseDetail.addEventListener('click', goBackToCatalog);

    genderFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderFilterButtons.forEach(b => {
                b.classList.remove('bg-obsidian-950', 'text-gold-500', 'shadow');
                b.classList.add('bg-white', 'text-stone-700');
            });
            btn.classList.add('bg-obsidian-950', 'text-gold-500', 'shadow');
            btn.classList.remove('bg-white', 'text-stone-700');
            currentGender = btn.dataset.gender;
            renderProducts(searchInput.value);
        });
    });

    categoryFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryFilterButtons.forEach(b => {
                b.classList.remove('bg-stone-800', 'text-white', 'shadow');
                b.classList.add('bg-white', 'text-stone-700');
            });
            btn.classList.add('bg-stone-800', 'text-white', 'shadow');
            btn.classList.remove('bg-white', 'text-stone-700');
            currentCategory = btn.dataset.category;
            renderProducts(searchInput.value);
        });
    });

    searchInput.addEventListener('input', (e) => renderProducts(e.target.value));

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.view === 'detail' && e.state.productId) {
            openDetailView(e.state.productId, false);
        } else {
            if (e.state && typeof e.state.scrollPos === 'number') lastScrollPosition = e.state.scrollPos;
            showHomeView(false);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!detailView.classList.contains('view-hidden')) goBackToCatalog();
        }
    });

    renderProducts();

    const hash = window.location.hash;
    if (hash.startsWith('#producto-')) {
        const id = parseInt(hash.replace('#producto-', ''), 10);
        if (id) openDetailView(id, false);
    }
});