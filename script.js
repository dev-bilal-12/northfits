/* =========================================================
   NORTH FITS — Interactions
   ========================================================= */

/* Products ab "products.js" se aate hain — woh file khol kar apne
   products add/change karo (koi admin panel ya backend nahi hai). */
const PRODUCTS =
  (typeof NF_PRODUCTS !== 'undefined' && Array.isArray(NF_PRODUCTS))
    ? NF_PRODUCTS
    : [];

const SIZES = {
  Trousers: ['28', '30', '32', '34', '36'],
  Outfit: ['S', 'M', 'L', 'XL', 'XXL']
};

const CURRENCY = 'Rs. ';

/* ---------- Locations — kahan kahan product dikhana hai (products.js mein set hota hai) ---------- */
function defaultLocs(p) {
  const l = [];
  if (p.new) l.push('new');
  if (p.category === 'Trousers') l.push('trousers');
  if (p.category === 'Outfit') l.push('outfits');
  l.push('collections');
  return l;
}
function inLoc(p, loc) {
  /* Jo products.js mein likha ho wohi respect karo — locations ki khaali list = kahin na dikhao */
  if (Array.isArray(p.locations)) return p.locations.includes(loc);
  return defaultLocs(p).includes(loc);
}

/* Badge: custom (bg/text colour) ya classic type (new/hot) */
function badgeHtml(b) {
  if (!b || !b.label) return '';
  const cls = b.type ? ' badge ' + b.type : ' badge';
  const style = (b.bg || b.color)
    ? ' style="background:' + (b.bg || '#122b1e') + ';color:' + (b.color || '#f6f1e6') + ';border:0"'
    : '';
  return '<span class="' + cls.trim() + '"' + style + '>' + b.label + '</span>';
}

/* ---------- Product grid ---------- */
function productCard(p, i) {
  const badge = badgeHtml(p.badge) || (p.new ? '<span class="badge new">New</span>' : '');
  const old = p.oldPrice ? `<del>${CURRENCY}${p.oldPrice.toLocaleString()}</del>` : '';
  const imgs = (p.images && p.images.length) ? p.images.slice(0, 3) : [];
  const img = imgs.length
    ? `<img class="product-img" src="${imgs[0]}" data-srcs="${imgs.map(encodeURIComponent).join('|')}" alt="${p.name}" loading="lazy" />`
    : '';
  const dots = (p.colors && p.colors.length)
    ? `<div class="color-dots">${p.colors.slice(0, 4).map((c) => `<span class="color-dot" style="background:${c.hex}" title="${c.name}"></span>`).join('')}${p.colors.length > 4 ? `<span class="color-dot more">+${p.colors.length - 4}</span>` : ''}</div>`
    : '';

  return `
    <article class="product-card" data-product data-index="${i}" tabindex="0" aria-label="Quick view ${p.name}">
      <div class="product-visual ${p.visual}${img ? ' has-image' : ''}">${img}${badge}<span class="product-name">${p.name}</span></div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <h4>${p.name}</h4>
        ${dots}
        <div class="product-bottom">
          <span class="price">${CURRENCY}${p.price.toLocaleString()}${old}</span>
        </div>
      </div>
    </article>`;
}

const productGrid = document.querySelector('[data-products]');
function renderProductGrids() {
  document.querySelectorAll('[data-products]').forEach((grid) => {
    const filter = grid.dataset.filter || 'all';
    let items = PRODUCTS;
    if (filter === 'new') items = PRODUCTS.filter((p) => inLoc(p, 'new'));
    else if (filter === 'trousers') items = PRODUCTS.filter((p) => inLoc(p, 'trousers'));
    else if (filter === 'outfits') items = PRODUCTS.filter((p) => inLoc(p, 'outfits'));
    else if (filter === 'collections') items = PRODUCTS.filter((p) => inLoc(p, 'collections'));
    else if (filter === 'featured') items = PRODUCTS.filter((p) => inLoc(p, 'home'));
    else if (filter === 'all') items = PRODUCTS.filter((p) => inLoc(p, 'collections'));
    if (!items.length) {
      grid.innerHTML = '<p class="grid-empty">Nothing here yet — add products in products.js.</p>';
      return;
    }
    grid.innerHTML = items.map((p) => productCard(p, PRODUCTS.indexOf(p))).join('');

    /* Hover = ghoom kar teeno images dikhao */
    grid.querySelectorAll('.product-img[data-srcs]').forEach((imgEl) => {
      const srcs = decodeURIComponent(imgEl.dataset.srcs).split('|').filter(Boolean);
      if (srcs.length < 2) return;
      let idx = 0;
      imgEl.addEventListener('mouseenter', () => {
        idx = (idx + 1) % srcs.length;
        imgEl.src = srcs[idx];
      });
      imgEl.addEventListener('mouseleave', () => {
        idx = 0;
        imgEl.src = srcs[0];
      });
    });
  });
}
renderProductGrids();
/* autoco (test/demo) support */
if (new URLSearchParams(location.search).has('autoco')) {
  if (!cartItems.size && PRODUCTS[0]) {
    addToCart(0, { size: 'M', colorName: 'Green' });
  }
  openCheckout();
  goCoStep(1);
}

/* ---------- Home content ----------
   Homepage ki collection cards, editorial text waghera ab index.html mein
   static hain — woh file khol kar seedha text/images badlo. */

/* ---------- Cart ---------- */
const cartItems = new Map();
const cartEl = document.querySelector('[data-cart]');
const backdropEl = document.querySelector('[data-cart-backdrop]');
const cartListEl = document.querySelector('[data-cart-list]');
const cartCountEl = document.querySelector('[data-cart-count]');
const cartTotalEl = document.querySelector('[data-cart-total]');
const toastEl = document.querySelector('[data-toast]');
let toastTimer = null;

function formatPrice(n) {
  return CURRENCY + n.toLocaleString();
}

const CART_KEY = 'nf-cart';

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify([...cartItems.entries()]));
  } catch (e) { /* storage unavailable */ }
}

function updateCartUI() {
  const count = [...cartItems.values()].reduce((a, b) => a + b.qty, 0);
  const total = [...cartItems.values()].reduce((a, b) => a + b.qty * b.price, 0);

  if (cartCountEl) cartCountEl.textContent = count;
  if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);

  if (cartListEl) {
    if (count === 0) {
      cartListEl.innerHTML = '<p class="cart-empty">Your cart is empty.<br />Start exploring the collection.</p>';
      return;
    }
    cartListEl.innerHTML = [...cartItems.entries()]
      .map(([key, item]) => {
        const col = item.colorName
          ? `<span class="color-dot-sm" style="background:${item.colorHex || '#999999'}"></span>${item.colorName}`
          : '';
        const detail = [item.size, col].filter(Boolean).join(' · ');
        const thumb = (item.images && item.images.length)
          ? `<div class="cart-thumb has-img"><img src="${item.images[0]}" alt="${item.name}" /></div>`
          : `<div class="cart-thumb ${item.visual}"></div>`;
        return `
        <li class="cart-item">
          ${thumb}
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>${item.category}${detail ? ' · ' + detail : ''} &times; ${item.qty}</p>
          </div>
          <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
          <button class="remove-btn" aria-label="Remove ${item.name}" data-remove="${key}">&times;</button>
        </li>`;
      })
      .join('');
  }
}

function addToCart(index, opts = {}) {
  ensureAudio();
  const p = PRODUCTS[index];
  const key = `${index}|${opts.size || ''}|${opts.colorName || ''}`;
  const existing = cartItems.get(key);
  if (existing) {
    existing.qty += 1;
  } else {
    cartItems.set(key, { ...p, index, size: opts.size || null, colorName: opts.colorName || null, colorHex: opts.colorHex || null, qty: 1 });
  }
  updateCartUI();
  saveCart();
  const detail = [opts.size, opts.colorName].filter(Boolean).join(' · ');
  showToast(detail ? `${p.name} (${detail}) added to cart` : `${p.name} added to cart`);
}

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

/* ---------- Quick view — product modal ---------- */
function buildQuickView() {
  if (document.querySelector('[data-qv]')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="qv-backdrop" data-qv-backdrop></div>
    <aside class="qv" data-qv role="dialog" aria-modal="true" aria-labelledby="qv-name">
      <button class="qv-close" data-qv-close aria-label="Close">&times;</button>
      <div class="qv-gallery">
        <span class="qv-badge" data-qv-badge></span>
        <div class="qv-stage" data-qv-stage>
          <div class="qv-imgs" data-qv-imgs></div>
          <div class="qv-dots" data-qv-dots></div>
        </div>
      </div>
      <div class="qv-info">
        <div class="qv-body">
          <p class="product-cat" data-qv-cat></p>
          <h3 id="qv-name" data-qv-name></h3>
          <div class="qv-price">
            <span class="price" data-qv-price></span>
            <span class="qv-save" data-qv-save></span>
          </div>
          <p class="qv-desc" data-qv-desc></p>
          <div class="qv-row">
            <span class="qv-label">Colour</span>
            <div class="qv-colors" data-qv-colors></div>
          </div>
          <div class="qv-row">
            <span class="qv-label">Size</span>
            <div class="qv-sizes" data-qv-sizes></div>
            <p class="qv-note" data-qv-note></p>
          </div>
          <a class="qv-insta" data-qv-insta href="#" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1"/></svg>
            View detailing on Instagram
          </a>
        </div>
        <button class="btn btn-solid qv-add" data-qv-add>Add to Cart</button>
      </div>
    </aside>`;

  document.body.appendChild(wrap);
  wrap.querySelector('[data-qv-close]').addEventListener('click', closeQuickView);
  wrap.querySelector('[data-qv-backdrop]').addEventListener('click', closeQuickView);

  const stageEl = wrap.querySelector('[data-qv-stage]');
  let pointX = null;
  let pointY = null;
  stageEl.addEventListener('pointerdown', (e) => {
    pointX = e.clientX;
    pointY = e.clientY;
  }, { passive: true });
  stageEl.addEventListener('pointerup', (e) => {
    if (pointX === null) return;
    const dx = e.clientX - pointX;
    const dy = e.clientY - pointY;
    pointX = null;
    pointY = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      const total = galleryVisuals(PRODUCTS[qv.index]).length;
      const next = dx < 0 ? Math.min(qv.imgIdx + 1, total - 1) : Math.max(qv.imgIdx - 1, 0);
      setQvImage(next);
    }
  });
}

const qv = { index: null, size: null, colorIdx: 0, imgIdx: 0 };

function galleryVisuals(p) {
  if (p.images && p.images.length) {
    return p.images.slice(0, 3).map((src) => ({ visual: 'visual-img', variant: '', src }));
  }
  return [
    { visual: p.visual, variant: '' },
    { visual: p.visual, variant: ' qv-v2' },
    { visual: p.visual, variant: ' qv-v3' }
  ];
}

function setQvImage(i) {
  qv.imgIdx = i;
  document.querySelectorAll('[data-qv-img]').forEach((img, k) => img.classList.toggle('active', k === i));
  document.querySelectorAll('[data-qv-dot]').forEach((dot, k) => dot.classList.toggle('active', k === i));
}

function openQuickView(index) {
  buildQuickView();
  const p = PRODUCTS[index];
  qv.index = index;
  qv.size = null;
  qv.colorIdx = 0;
  qv.imgIdx = 0;

  const el = document.querySelector('[data-qv]');
  const badge = badgeHtml(p.badge);
  el.querySelector('.qv-badge').innerHTML = badge;
  el.querySelector('[data-qv-cat]').textContent = p.category;
  el.querySelector('[data-qv-name]').textContent = p.name;
  el.querySelector('[data-qv-price]').innerHTML =
    `${CURRENCY}${p.price.toLocaleString()}` + (p.oldPrice ? `<del>${CURRENCY}${p.oldPrice.toLocaleString()}</del>` : '');
  el.querySelector('[data-qv-save]').textContent = p.oldPrice
    ? `Save ${CURRENCY}${(p.oldPrice - p.price).toLocaleString()}`
    : '';
  el.querySelector('[data-qv-desc]').textContent = p.desc;

  const instaLink = el.querySelector('[data-qv-insta]');
  if (instaLink) {
    const url = (p.insta || '').trim();
    if (url) {
      instaLink.href = /^https?:\/\//i.test(url) ? url : 'https://' + url;
      instaLink.style.display = '';
    } else {
      instaLink.style.display = 'none';
    }
  }

  const imgs = galleryVisuals(p);
  el.querySelector('[data-qv-imgs]').innerHTML = imgs
    .map((g, i) => g.src
      ? `<div class="qv-img visual-img${i === 0 ? ' active' : ''}" data-qv-img="${i}"><img class="qv-photo" src="${g.src}" alt="${p.name}" /></div>`
      : `<div class="qv-img ${g.visual}${g.variant}${i === 0 ? ' active' : ''}" data-qv-img="${i}"></div>`)
    .join('');
  el.querySelector('[data-qv-dots]').innerHTML = imgs
    .map((g, i) => `<button class="qv-dot${i === 0 ? ' active' : ''}" data-qv-dot="${i}" aria-label="Image ${i + 1}"></button>`)
    .join('');

  el.querySelector('[data-qv-colors]').innerHTML = p.colors
    .map((c, i) => `<button class="swatch${i === 0 ? ' active' : ''}" data-qv-color="${i}" style="background:${c.hex}" title="${c.name}" aria-label="Colour ${c.name}"></button>`)
    .join('');

  const pSizes = (p.sizes && p.sizes.length) ? p.sizes : (SIZES[p.category] || []);
  el.querySelector('[data-qv-sizes]').innerHTML = pSizes
    .map((s) => `<button class="qv-size" data-qv-size="${s}">${s}</button>`)
    .join('');
  el.querySelector('[data-qv-note]').textContent = '';
  el.querySelector('[data-qv-add]').disabled = true;

  document.querySelector('[data-qv-backdrop]').classList.add('open');
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const el = document.querySelector('[data-qv]');
  const backdrop = document.querySelector('[data-qv-backdrop]');
  if (el) {
    el.classList.remove('open');
    backdrop?.classList.remove('open');
  }
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  const qvDot = e.target.closest('[data-qv-dot]');
  if (qvDot) { setQvImage(Number(qvDot.dataset.qvDot)); return; }

  const qvColor = e.target.closest('[data-qv-color]');
  if (qvColor) {
    qv.colorIdx = Number(qvColor.dataset.qvColor);
    document.querySelectorAll('[data-qv-color]').forEach((b, i) => b.classList.toggle('active', i === qv.colorIdx));
    return;
  }

  const qvSize = e.target.closest('[data-qv-size]');
  if (qvSize) {
    qv.size = qvSize.dataset.qvSize;
    document.querySelectorAll('[data-qv-size]').forEach((b) => b.classList.toggle('active', b === qvSize));
    const addBtn = document.querySelector('[data-qv-add]');
    if (addBtn) addBtn.disabled = false;
    const note = document.querySelector('[data-qv-note]');
    if (note) note.textContent = '';
    return;
  }

  const qvAdd = e.target.closest('[data-qv-add]');
  if (qvAdd) {
    if (!qv.size) {
      const note = document.querySelector('[data-qv-note]');
      if (note) note.textContent = 'Please select a size first.';
      return;
    }
    const p = PRODUCTS[qv.index];
    const colorName = p.colors[qv.colorIdx].name;
    addToCart(qv.index, { size: qv.size, colorName, colorHex: p.colors[qv.colorIdx].hex });
    if (cartCountEl) {
      cartCountEl.classList.remove('pop');
      void cartCountEl.offsetWidth;
      cartCountEl.classList.add('pop');
    }
    qvAdd.classList.remove('pop');
    void qvAdd.offsetWidth;
    qvAdd.classList.add('pop');
    setTimeout(() => {
      closeQuickView();
      openCart();
    }, 420);
    return;
  }

  const product = e.target.closest('[data-product]');
  if (product) {
    search?.close();
    openQuickView(Number(product.dataset.index));
    return;
  }

  const remove = e.target.closest('[data-remove]');
  if (remove) {
    cartItems.delete(remove.dataset.remove);
    updateCartUI();
    saveCart();

  }
});

/* =========================================================
   Image Lightbox — quick view ki photo par click → fullscreen
   zoom in/out, drag-pan, mouse-wheel zoom, prev/next
   ========================================================= */
const zb = { el: null, img: null, srcs: [], idx: 0, scale: 1, tx: 0, ty: 0, min: 1, max: 4 };

function buildZoomBox() {
  if (zb.el) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="zb" data-zb role="dialog" aria-modal="true" aria-label="Image viewer">
      <p class="zb-hint">Scroll to zoom · Drag to move · Double-click to reset</p>
      <button class="zb-close" data-zb-close aria-label="Close image viewer">&times;</button>
      <p class="zb-count" data-zb-count></p>
      <button class="zb-nav zb-prev" data-zb-prev aria-label="Previous image">&#10094;</button>
      <button class="zb-nav zb-next" data-zb-next aria-label="Next image">&#10095;</button>
      <div class="zb-stage" data-zb-stage>
        <img class="zb-img" data-zb-img alt="Product image" draggable="false" />
      </div>
      <div class="zb-bar">
        <button class="zb-btn" data-zb-out aria-label="Zoom out">&#8722;</button>
        <span class="zb-zoom" data-zb-zoom>100%</span>
        <button class="zb-btn" data-zb-in aria-label="Zoom in">+</button>
        <button class="zb-btn" data-zb-reset aria-label="Reset zoom">Reset</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  zb.el = wrap.querySelector('[data-zb]');
  zb.img = wrap.querySelector('[data-zb-img]');
  const stage = wrap.querySelector('[data-zb-stage]');
  const zoomLabel = wrap.querySelector('[data-zb-zoom]');

  let panning = false;
  let panStart = null;
  let startTX = 0;
  let startTY = 0;
  let suppressClick = false;

  function applyZoom() {
    zb.img.style.transform = `translate(${zb.tx}px, ${zb.ty}px) scale(${zb.scale})`;
    zoomLabel.textContent = Math.round(zb.scale * 100) + '%';
  }

  function clampPan() {
    if (!zb.img.naturalWidth) return;
    const iw = zb.img.naturalWidth * zb.scale;
    const ih = zb.img.naturalHeight * zb.scale;
    const maxX = Math.max(0, (iw - zb.el.clientWidth) / 2 + 60);
    const maxY = Math.max(0, (ih - zb.el.clientHeight) / 2 + 60);
    zb.tx = Math.max(-maxX, Math.min(maxX, zb.tx));
    zb.ty = Math.max(-maxY, Math.min(maxY, zb.ty));
  }

  function resetZoom() {
    zb.scale = 1; zb.tx = 0; zb.ty = 0;
    applyZoom();
  }

  function zoomAt(cx, cy, factor) {
    const ns = Math.max(zb.min, Math.min(zb.max, zb.scale * factor));
    const k = ns / zb.scale;
    zb.tx = cx - (cx - zb.tx) * k;
    zb.ty = cy - (cy - zb.ty) * k;
    zb.scale = ns;
    if (zb.scale <= 1) { zb.tx = 0; zb.ty = 0; }
    clampPan();
    applyZoom();
  }

  function setZbImage(i) {
    if (!zb.srcs.length) return;
    zb.idx = (i + zb.srcs.length) % zb.srcs.length;
    zb.img.src = zb.srcs[zb.idx];
    resetZoom();
    wrap.querySelector('[data-zb-count]').textContent = `${zb.idx + 1} / ${zb.srcs.length}`;
    wrap.querySelector('[data-zb-prev]').hidden = zb.srcs.length < 2;
    wrap.querySelector('[data-zb-next]').hidden = zb.srcs.length < 2;
  }
  zb.setImage = setZbImage;

  wrap.querySelector('[data-zb-close]').addEventListener('click', closeZoom);
  wrap.querySelector('[data-zb-in]').addEventListener('click', () => zoomAt(0, 0, 1.25));
  wrap.querySelector('[data-zb-out]').addEventListener('click', () => zoomAt(0, 0, 0.8));
  wrap.querySelector('[data-zb-reset]').addEventListener('click', resetZoom);
  wrap.querySelector('[data-zb-prev]').addEventListener('click', (e) => {
    e.stopPropagation();
    setZbImage(zb.idx - 1);
    if (qv.index !== null) setQvImage(zb.idx);
  });
  wrap.querySelector('[data-zb-next]').addEventListener('click', (e) => {
    e.stopPropagation();
    setZbImage(zb.idx + 1);
    if (qv.index !== null) setQvImage(zb.idx);
  });

  stage.addEventListener('click', (e) => {
    if (suppressClick) { suppressClick = false; return; }
    if (e.target === stage) closeZoom();
  });

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    zoomAt(
      e.clientX - r.left - r.width / 2,
      e.clientY - r.top - r.height / 2,
      e.deltaY < 0 ? 1.18 : 1 / 1.18
    );
  }, { passive: false });

  zb.img.addEventListener('dblclick', () => {
    if (zb.scale > 1) { resetZoom(); } else { zoomAt(0, 0, 2.4); }
  });

  stage.addEventListener('pointerdown', (e) => {
    if (zb.scale <= 1) return;
    panning = true;
    panStart = { x: e.clientX, y: e.clientY };
    startTX = zb.tx; startTY = zb.ty;
    stage.classList.add('panning');
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!panning || !panStart) return;
    zb.tx = startTX + (e.clientX - panStart.x);
    zb.ty = startTY + (e.clientY - panStart.y);
    clampPan();
    applyZoom();
  });
  function endPan() {
    if (!panning) return;
    panning = false;
    stage.classList.remove('panning');
    if (panStart && (Math.abs(zb.tx - startTX) > 4 || Math.abs(zb.ty - startTY) > 4)) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    panStart = null;
  }
  stage.addEventListener('pointerup', endPan);
  stage.addEventListener('pointercancel', endPan);
}

function openZoom(srcs, idx) {
  buildZoomBox();
  if (!zb.el || !srcs || !srcs.length) return;
  zb.srcs = srcs;
  zb.setImage(idx || 0);
  zb.el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeZoom() {
  if (!zb.el) return;
  zb.el.classList.remove('open');
  if (!document.querySelector('.qv.open')) {
    document.body.style.overflow = '';
  }
}

/* Quick view ki photo par click → fullscreen lightbox */
document.addEventListener('click', (e) => {
  const photo = e.target.closest('.qv-img.active .qv-photo');
  if (photo && qv.index !== null) {
    const p = PRODUCTS[qv.index];
    const srcs = Array.isArray(p.images) ? p.images.slice(0, 3) : [];
    if (srcs.length) openZoom(srcs, qv.imgIdx);
  }
});

/* ---------- Page loader ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) return;
  const url = new URL(a.href, location.href);
  if (url.origin === location.origin) {
    sessionStorage.setItem('nf-internal-nav', '1');
  }
});

const loaderEl = document.querySelector('[data-loader]');
if (loaderEl) {
  const internalNav = sessionStorage.getItem('nf-internal-nav') === '1';
  sessionStorage.removeItem('nf-internal-nav');
  const navType = (performance.getEntriesByType('navigation')[0]?.type) || 'navigate';
  const skipLoader = navType === 'back_forward' || (navType === 'navigate' && internalNav);

  if (skipLoader) {
    loaderEl.remove();
  } else {
    const loaderStart = Date.now();
    const loaderMin = 1000;
    let loaderDone = false;
    const hideLoader = () => {
      if (loaderDone) return;
      loaderDone = true;
      const remain = Math.max(0, loaderMin - (Date.now() - loaderStart));
      setTimeout(() => {
        loaderEl.classList.add('done');
        setTimeout(() => loaderEl.remove(), 600);
      }, remain);
    };
    setTimeout(hideLoader, loaderMin);
    window.addEventListener('load', hideLoader);
  }
}

/* ---------- Search ---------- */
function matchesQuery(p, term) {
  const hay = [
    p.name,
    p.category,
    p.desc,
    p.badge ? p.badge.label : '',
    ...p.colors.map((c) => c.name)
  ].join(' ').toLowerCase();
  return term.split(/\s+/).every((w) => hay.includes(w));
}

function buildSearch() {
  if (document.querySelector('[data-search]')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="search-backdrop" data-search-backdrop></div>
    <section class="search-panel" data-search role="dialog" aria-modal="true" aria-label="Search products">
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input class="search-input" data-search-input type="text" placeholder="Search trousers, outfits, co-ords, colours…" aria-label="Search products" autocomplete="off" spellcheck="false" />
        <button class="search-clear" data-search-clear aria-label="Clear search" tabindex="-1">&times;</button>
      </div>
      <p class="search-meta" data-search-meta>Type a keyword to search the collection.</p>
      <div class="search-grid" data-search-grid></div>
    </section>`;

  document.body.appendChild(wrap);

  const panel = wrap.querySelector('[data-search]');
  const backdrop = wrap.querySelector('[data-search-backdrop]');
  const input = wrap.querySelector('[data-search-input]');
  const grid = wrap.querySelector('[data-search-grid]');
  const meta = wrap.querySelector('[data-search-meta]');
  const clearBtn = wrap.querySelector('[data-search-clear]');

  function render(q) {
    const raw = q.trim();
    const term = raw.toLowerCase();
    if (!term) {
      meta.textContent = 'Type a keyword to search the collection.';
      grid.innerHTML = '';
      clearBtn.style.visibility = 'hidden';
      return;
    }
    clearBtn.style.visibility = 'visible';
    const matches = PRODUCTS.filter((p) => matchesQuery(p, term));
    if (matches.length === 0) {
      meta.textContent = `\u201C${raw}\u201D \u2014 no results found.`;
      grid.innerHTML = '';
      return;
    }
    meta.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} for \u201C${raw}\u201D`;
    grid.innerHTML = matches.map((p) => productCard(p, PRODUCTS.indexOf(p))).join('');
  }

  function openSearch() {
    backdrop.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    render('');
    input.focus();
  }

  function closeSearch() {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  backdrop.addEventListener('click', closeSearch);
  clearBtn.addEventListener('click', () => { input.value = ''; render(''); input.focus(); });
  input.addEventListener('input', () => render(input.value));

  document.querySelectorAll('.icon-btn[aria-label="Search"]').forEach((btn) => {
    if (btn.dataset.searchBound) return;
    btn.dataset.searchBound = '1';
    btn.addEventListener('click', openSearch);
  });

  return { open: openSearch, close: closeSearch };
}

const search = buildSearch();

function openCart() {
  ensureAudio();
  cartEl?.classList.add('open');
  backdropEl?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartEl?.classList.remove('open');
  backdropEl?.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);
document.querySelector('[data-cart-close]')?.addEventListener('click', closeCart);
backdropEl?.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { search?.close(); closeQuickView(); closeZoom(); closeCart(); closeCheckout(); }
  if (e.key === 'Enter' && e.target.matches('[data-product]')) {
    search?.close();
    openQuickView(Number(e.target.dataset.index));
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (!e.target.closest('.co input, .co textarea')) return;
  e.preventDefault();
  const focusables = [...document.querySelectorAll('.co input, .co textarea')]
    .filter((el) => !el.disabled && el.offsetParent !== null);
  const idx = focusables.indexOf(e.target);
  const next = focusables[idx + 1];
  if (next) next.focus();
  else e.target.blur();
});

/* ---------- Mobile menu ---------- */
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('[data-mobile-menu]');

navToggle?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
});

mobileMenu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  })
);

/* ---------- Newsletter ---------- */
/* Jab koi user email enter kare to woh email Gmail
   (bilalsamad.work@gmail.com) par forward hota hai FormSubmit ke zariye. */
const NEWSLETTER_GMAIL = 'bilalsamad.work@gmail.com';
const form = document.querySelector('[data-newsletter]');
const note = document.querySelector('[data-newsletter-note]');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  const email = (input && input.value || '').trim();
  if (!email) return;
  if (note) note.textContent = 'Subscribing…';

  /* Gmail par forward (FormSubmit — backend ki zaroorat nahi) */
  try {
    fetch('https://formsubmit.co/ajax/' + NEWSLETTER_GMAIL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: 'North Fits — New Newsletter Subscriber',
        _template: 'table',
        _captcha: 'false',
        email
      })
    }).catch(() => {});
  } catch (err) { /* forward fail — sirf local save reh jayega */ }

  if (note) {
    note.textContent = `Welcome to the circle, ${email}. Keep an eye on your inbox.`;
    form.reset();
  }
});

/* ---------- Footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Header shadow on scroll ---------- */
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (!header) return;
  if (window.scrollY > 8) {
    header.style.boxShadow = '0 8px 30px rgba(14, 35, 24, 0.08)';
  } else {
    header.style.boxShadow = 'none';
  }
});

updateCartUI();
/* =========================================================
   NORTH FITS — Checkout Flow
   ========================================================= */

const CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad / Rawalpindi',
  'Faisalabad',
  'Multan',
  'Sialkot / Gujranwala',
  'Other City (Pakistan)'
];

const CO_STEPS = ['Items', 'Contact', 'Address', 'Confirm'];

const checkout = { step: 0, processing: false };

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function playTransactionSound() {
  ensureAudio();
  if (!audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const t = now + i * 0.11;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  });
}

function buildCheckout() {
  if (document.querySelector('[data-co]')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="co-backdrop" data-co-backdrop></div>
    <section class="co" data-co role="dialog" aria-modal="true" aria-label="Checkout">
      <button class="co-close" data-co-close aria-label="Close checkout">&times;</button>
      <header class="co-head">
        <p class="co-kicker">Secure Checkout</p>
        <h3>Checkout</h3>
        <div class="co-steps" data-co-steps></div>
      </header>

      <div class="co-track">
        <div class="co-track-inner" data-co-track>
          <section class="co-slide" data-co-slide="0">
            <p class="co-kicker">Your Order</p>
            <h4 class="co-slide-title">Item Summary</h4>
            <ul class="co-items" data-co-items></ul>
            <div class="co-total-row"><span>Subtotal</span><strong data-co-subtotal>Rs. 0</strong></div>
          </section>

          <section class="co-slide" data-co-slide="1">
            <p class="co-kicker">Contact</p>
            <h4 class="co-slide-title">Your Details</h4>
            <div class="co-form">
              <label class="co-field">Full Name
                <input data-co-name type="text" placeholder="e.g. Ahsan Raza" autocomplete="name" />
              </label>
              <label class="co-field">WhatsApp Number
                <input data-co-whatsapp type="tel" inputmode="numeric" placeholder="03xx-xxxxxxx" autocomplete="tel" />
              </label>
              <label class="co-field">Contact Number
                <input data-co-contact type="tel" inputmode="numeric" placeholder="03xx-xxxxxxx" autocomplete="tel" />
              </label>
            </div>
            <p class="co-error" data-co-error></p>
          </section>

          <section class="co-slide" data-co-slide="2">
            <p class="co-kicker">Delivery</p>
            <h4 class="co-slide-title">Shipping Address</h4>
            <div class="co-form">
              <label class="co-field">Full Address
                <textarea data-co-address rows="3" placeholder="House, Street, Block, Area / City"></textarea>
              </label>
              <label class="co-field">Nearest Landmark
                <input data-co-landmark type="text" placeholder="e.g. Near Al-Falah Market" />
              </label>
              <label class="co-field">Postal Code <span class="co-req-opt">(optional)</span>
                <input data-co-postal type="text" inputmode="numeric" placeholder="e.g. 54000" />
              </label>
            </div>
            <p class="co-error" data-co-error2></p>
          </section>

          <section class="co-slide" data-co-slide="3">
            <p class="co-kicker">Confirm</p>
            <h4 class="co-slide-title">Order Summary</h4>
            <ul class="co-items" data-co-review></ul>
            <div class="co-delivery">
              <div class="co-del-row">
                <span>Delivery Location</span>
                <select data-co-city aria-label="Delivery city"></select>
              </div>
              <div class="co-del-row">
                <span>Delivery Charges</span>
                <strong data-co-ship>-</strong>
              </div>
              <p class="co-del-note">Delivery charges will be shared &amp; submitted in advance after order confirmation from our team on WhatsApp.</p>
            </div>
            <div class="co-total-row"><span>Total</span><strong data-co-total>Rs. 0</strong></div>
          </section>
        </div>
      </div>

      <footer class="co-foot">
        <button class="btn btn-ghost co-back-btn" data-co-back>Back</button>
        <button class="btn btn-solid co-next-btn" data-co-next>Continue to Proceed Order</button>
      </footer>

      <div class="co-success" data-co-success>
        <div class="co-loading" data-co-loading>
          <div class="co-loader">
            <span class="co-loader-ring r1"></span>
            <span class="co-loader-ring r2"></span>
            <img src="NORTH%20FITS%20LOGO.png" alt="North Fits" />
          </div>
          <p>Processing your order…</p>
        </div>
        <div class="co-tick" data-co-tick style="display:none">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="co-tick-circle" cx="50" cy="50" r="45" />
            <path class="co-tick-check" d="M28 52 L45 68 L73 38" />
          </svg>
          <p>Order Confirmed</p>
          <p class="co-tick-ref" data-co-tick-ref style="display:none">Order <span>NF0001</span></p>
        </div>
      </div>
    </section>`;

  document.body.appendChild(wrap);

  const stepsEl = wrap.querySelector('[data-co-steps]');
  stepsEl.innerHTML = CO_STEPS.map((label, i) =>
    `<div class="co-step" data-co-step="${i}"><span class="co-step-dot">${i + 1}</span><span class="co-step-label">${label}</span></div>` +
    (i < CO_STEPS.length - 1 ? `<div class="co-step-bar" data-co-bar="${i}"></div>` : '')
  ).join('');

  const cityEl = wrap.querySelector('[data-co-city]');
  cityEl.innerHTML = CITIES.map((name, i) => `<option value="${i}">${name}</option>`).join('');

  wrap.querySelector('[data-co-close]').addEventListener('click', closeCheckout);
  wrap.querySelector('[data-co-backdrop]').addEventListener('click', closeCheckout);
  wrap.querySelector('[data-co-back]').addEventListener('click', () => goCoStep(checkout.step - 1));
  wrap.querySelector('[data-co-next]').addEventListener('click', nextCoStep);
  wrap.querySelector('[data-co-city]').addEventListener('change', renderCoSummary);
  wrap.querySelectorAll('.co-field input[type="tel"]').forEach(bindPkPhoneFormat);
}

function bindPkPhoneFormat(el) {
  el.addEventListener('input', () => {
    let d = el.value.replace(/\D/g, '').slice(0, 11);
    el.value = d.length > 4 ? d.slice(0, 4) + '-' + d.slice(4) : d;
  });
}

function validPkNumber(v) {
  return /^03\d{9}$/.test(v.replace(/\D/g, ''));
}

function coItemRow(item) {
  const col = item.colorName
    ? `<span class="color-dot-sm" style="background:${item.colorHex || '#999999'}"></span>${item.colorName}`
    : '';
  const detail = [item.size, col].filter(Boolean).join(' · ');
  const thumb = (item.images && item.images.length)
    ? `<div class="co-thumb has-img"><img src="${item.images[0]}" alt="${item.name}" /></div>`
    : `<div class="co-thumb ${item.visual}"></div>`;
  return `
    <li class="co-item">
      ${thumb}
      <div class="co-item-info">
        <h4>${item.name}</h4>
        <p>${item.category}${detail ? ' · ' + detail : ''} &times; ${item.qty}</p>
      </div>
      <span class="co-item-price">${formatPrice(item.price * item.qty)}</span>
    </li>`;
}

function renderCoSummary() {
  const items = [...cartItems.values()];
  const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0);
  document.querySelector('[data-co-subtotal]').textContent = formatPrice(subtotal);
  document.querySelector('[data-co-ship]').textContent = '-';
  document.querySelector('[data-co-total]').textContent = formatPrice(subtotal);
}

function renderCo() {
  const items = [...cartItems.values()];
  document.querySelector('[data-co-items]').innerHTML = items.map(coItemRow).join('');
  document.querySelector('[data-co-review]').innerHTML = items.map(coItemRow).join('');
  renderCoSummary();
}

function clearCoErrors() {
  document.querySelectorAll('[data-co-error]').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.co-field input, .co-field textarea').forEach((el) => el.classList.remove('co-invalid'));
}

function goCoStep(n) {
  n = Math.max(0, Math.min(CO_STEPS.length - 1, n || 0));
  checkout.step = n;

  document.querySelectorAll('.co input, .co textarea').forEach((el) => {
    el.classList.remove('co-invalid');
  });

  document.querySelectorAll('[data-co-slide]').forEach((el, i) => {
    el.classList.toggle('active', i === n);
  });

  document.querySelectorAll('[data-co-step]').forEach((el, i) => {
    el.classList.toggle('done', i < n);
    el.classList.toggle('active', i === n);
  });
  document.querySelectorAll('[data-co-bar]').forEach((bar, i) => {
    bar.classList.toggle('done', i < n);
  });

  const back = document.querySelector('[data-co-back]');
  if (back) back.hidden = n === 0;

  const next = document.querySelector('[data-co-next]');
  if (next) {
    next.textContent =
      n === 0 ? 'Continue to Proceed Order' :
      n === 1 ? 'Continue' :
      n === 2 ? 'Review Order' : 'Complete Order';
  }

  clearCoErrors();
}

function validateCoForm(sels) {
  const err1 = document.querySelector('[data-co-error]');
  const err2 = document.querySelector('[data-co-error2]');
  let empty = false;
  sels.forEach((s) => {
    const el = document.querySelector(`[${s}]`);
    const v = el && el.value.trim();
    if (!v) { el.classList.add('co-invalid'); empty = true; }
    else el.classList.remove('co-invalid');
  });
  if (empty) {
    if (err1) err1.textContent = 'Please fill all the required fields.';
    if (err2) err2.textContent = '';
    return false;
  }
  const whatsapp = document.querySelector('[data-co-whatsapp]');
  if (whatsapp) {
    if (!validPkNumber(whatsapp.value)) {
      whatsapp.classList.add('co-invalid');
      if (err1) err1.textContent = 'WhatsApp number must start with 03 and be 11 digits (e.g. 0300-1234567).';
      return false;
    }
    whatsapp.classList.remove('co-invalid');
  }
  const contact = document.querySelector('[data-co-contact]');
  if (contact) {
    if (!validPkNumber(contact.value)) {
      contact.classList.add('co-invalid');
      if (err1) err1.textContent = 'Contact number must start with 03 and be 11 digits (e.g. 0300-1234567).';
      return false;
    }
    contact.classList.remove('co-invalid');
  }
  if (err1) err1.textContent = '';
  if (err2) err2.textContent = '';
  return true;
}

function nextCoStep() {
  if (checkout.processing) return;
  ensureAudio();

  if (checkout.step === 1 && !validateCoForm(['data-co-name', 'data-co-whatsapp', 'data-co-contact'])) return;
  if (checkout.step === 2 && !validateCoForm(['data-co-address', 'data-co-landmark'])) return;

  if (checkout.step === 3) {
    completeOrder();
    return;
  }
  goCoStep(checkout.step + 1);
}

function openCheckout() {
  if (cartItems.size === 0) {
    showToast('Your cart is empty.');
    return;
  }
  ensureAudio();
  buildCheckout();
  closeCart();

  document.querySelectorAll('[data-co] input, [data-co] textarea').forEach((el) => (el.value = ''));
  clearCoErrors();
  document.querySelector('[data-co-success]').classList.remove('show');
  document.querySelector('[data-co-loading]').style.display = 'grid';
  document.querySelector('[data-co-tick]').style.display = 'none';

  checkout.processing = false;
  renderCo();
  goCoStep(0);

  document.querySelector('[data-co]').classList.add('open');
  document.querySelector('[data-co-backdrop]').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  if (checkout.processing) return;
  document.querySelector('[data-co]')?.classList.remove('open');
  document.querySelector('[data-co-backdrop]')?.classList.remove('open');
  document.body.style.overflow = '';

  document.querySelectorAll('[data-co] input, [data-co] textarea').forEach((el) => (el.value = ''));
  clearCoErrors();
  goCoStep(0);
}

/* Order numbers — har order ko sequential number milta hai (NF0001, NF0002, …).
   Number ek FREE ONLINE counter (restful-api.dev par rakha counter object) se
   aata hai, is liye sab devices par same sequence continue hota hai — bilkul
   pehle server wale din ki tarah. Agar online counter na mile (internet band,
   service down) to browser apna LOCAL counter use karta hai taake order
   kabhi na ruke. */

const NF_ORDER_KEY = 'nf-order-seq-fallback';
const ORDER_SEQ_NAME = 'nf-order-seq';
const ORDER_SEQ_API = 'https://api.restful-api.dev/objects';
const ORDER_SEQ_ID = 'ff808181a09d98f701a0d3e0820e0858'; // counter object ki ID
const ORDER_SEQ_LIVE_ID_KEY = 'nf-order-seq-live-id';

function localOrderNumber() {
  let last = 0;
  try { last = Number(localStorage.getItem(NF_ORDER_KEY) || 0) || 0; } catch (e) { last = 0; }
  const next = last + 1;
  try { localStorage.setItem(NF_ORDER_KEY, String(next)); } catch (e) { /* ignore */ }
  return 'NF' + String(next).padStart(4, '0');
}

/* Online counter se agli number lo.
   Race se bachne ka tareeqa: PUT karte waqt ek apna random token bhi likhte
   hain, phir wapas GET karke check karte hain ke hamara token hi saved hai.
   Koi dusra device beech mein ghus jaye to retry hota hai. */
async function globalOrderSeq() {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      let id = localStorage.getItem(ORDER_SEQ_LIVE_ID_KEY) || ORDER_SEQ_ID;

      let gres = await fetch(ORDER_SEQ_API + '/' + id, { method: 'GET' });
      let seq = 0;
      if (gres.ok) {
        const obj = await gres.json();
        seq = Number(obj && obj.data && obj.data.seq) || 0;
      } else if (gres.status === 404) {
        /* Counter object gayab/reset ho gaya — naya bana lo, lekin local
           saved value se continue karo taake numbers peeche na jayen */
        const prev = Number(localStorage.getItem(NF_ORDER_KEY) || 0) || 0;
        const created = await fetch(ORDER_SEQ_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: ORDER_SEQ_NAME, data: { seq: prev, token: '' } })
        });
        if (!created.ok) throw new Error('counter create failed');
        const obj = await created.json();
        if (!obj || !obj.id) throw new Error('counter create: no id');
        localStorage.setItem(ORDER_SEQ_LIVE_ID_KEY, obj.id);
        continue; // naye id ke saath dobara
      } else {
        throw new Error('counter get failed: ' + gres.status);
      }

      const next = seq + 1;
      const myToken = Math.random().toString(36).slice(2) + Date.now().toString(36);

      const putRes = await fetch(ORDER_SEQ_API + '/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ORDER_SEQ_NAME, data: { seq: next, token: myToken } })
      });
      if (!putRes.ok) throw new Error('counter put failed');

      const verify = await (await fetch(ORDER_SEQ_API + '/' + id)).json();
      const v = verify && verify.data;
      if (v && String(v.token) === myToken && Number(v.seq) === next) {
        try { localStorage.setItem(NF_ORDER_KEY, String(next)); } catch (e) { /* ignore */ }
        return next;
      }
      /* kisi aur ne overwrite kar diya — retry */
    } catch (e) { /* retry */ }
  }
  return null; // online counter nahi mila → local fallback
}

async function nextOrderNumber() {
  const n = await globalOrderSeq();
  if (n !== null) return 'NF' + String(n).padStart(4, '0');
  return localOrderNumber();
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
   WhatsApp Order Confirmation
   Auto-filled message — customer only has to press send.
   ========================================================= */
const WHATSAPP_ORDER_NUMBER = '923706653839';

function getCoValue(sel) {
  const el = document.querySelector(sel);
  return el ? String(el.value || '').trim() : '';
}

function buildWhatsAppOrderMessage(orderNumber, items) {
  const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0);

  const lines = [];
  lines.push('*NORTH FITS — NEW ORDER*');
  lines.push('');
  lines.push(`*Order No:* ${orderNumber}`);
  lines.push('');
  lines.push('*Customer:*');
  lines.push(`Name: ${getCoValue('[data-co-name]')}`);
  lines.push(`WhatsApp: ${getCoValue('[data-co-whatsapp]')}`);
  lines.push(`Contact: ${getCoValue('[data-co-contact]')}`);
  lines.push('');
  lines.push('*Delivery Address:*');
  lines.push(getCoValue('[data-co-address]'));
  if (getCoValue('[data-co-landmark]')) lines.push(`Landmark: ${getCoValue('[data-co-landmark]')}`);
  if (getCoValue('[data-co-postal]')) lines.push(`Postal Code: ${getCoValue('[data-co-postal]')}`);
  const cityEl = document.querySelector('[data-co-city]');
  lines.push(`City: ${CITIES[Number(cityEl?.value || 0)] || ''}`);
  lines.push('');
  lines.push('*Order Items:*');
  items.forEach((it, i) => {
    const detail = [it.size, it.colorName].filter(Boolean).join(' · ');
    const label = detail ? `${it.name} (${detail})` : it.name;
    lines.push(`${i + 1}. ${label} x${it.qty} — ${formatPrice(it.price * it.qty)}`);
  });
  lines.push('');
  lines.push(`*Subtotal:* ${formatPrice(subtotal)}`);
  lines.push('');
  lines.push('Delivery charges will be confirmed on this chat.');

  return lines.join('\n');
}

function openWhatsAppOrder(orderNumber, items) {
  const text = encodeURIComponent(buildWhatsAppOrderMessage(orderNumber, items));
  const url = `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${text}`;

  /* iPhone/Safari (aur kuch aur browsers) window.open() ko POPUP samajh kar
     block kar dete hain jab wo user-click ke foran baad na ho — isi liye
     pehle popup try karo; agar block ho (null) to poora page WhatsApp par
     navigate ho jata hai, jo har device/browser par chalta hai. */
  const win = window.open(url, '_blank');
  if (win) return true;
  window.location.href = url;
  return false;
}

async function completeOrder() {
  if (checkout.processing) return;
  checkout.processing = true;
  ensureAudio();

  const successEl = document.querySelector('[data-co-success]');
  const loadingEl = document.querySelector('[data-co-loading]');
  const tickEl = document.querySelector('[data-co-tick]');
  const tickRefEl = document.querySelector('[data-co-tick-ref]');

  successEl.classList.add('show');
  loadingEl.style.display = 'grid';
  tickEl.style.display = 'none';
  if (tickRefEl) { tickRefEl.style.display = 'none'; }

  /* Order snapshot (cart clear hone se pehle le lo) */
  const orderItems = [...cartItems.values()].map((it) => ({ ...it }));

  /* Order number animation ke dauran parallel mein calculate hota hai —
     taake order confirm ke baad redirect slow na lage */
  const orderNumberPromise = nextOrderNumber();

  /* 1. "Processing" beat — fast */
  await delay(500);

  /* 2. Tick animation plays… */
  loadingEl.style.display = 'none';
  tickEl.style.display = 'grid';
  playTransactionSound();

  /* 3. Order number appears quickly */
  await delay(750);
  const orderNumber = await orderNumberPromise;
  if (tickRefEl) {
    tickRefEl.querySelector('span').textContent = orderNumber;
    tickRefEl.style.display = 'block';
  }

  /* Cart pehle clear karo — agar popup block ho kar poora page WhatsApp
     par navigate ho jaye to bhi cart reset rahe, resume-popup na aaye */
  cartItems.clear();
  saveCart();
  updateCartUI();

  /* 4. WhatsApp par redirect — message already ready, user sirf send karta hai */
  const waOpened = openWhatsAppOrder(orderNumber, orderItems);

  checkout.processing = false;

  /* 5. Popup khula → checkout band karke FORAN front (homepage) par redirect.
        Popup block ho gaya to page khud WhatsApp par chala gaya — kuch nahi karna */
  if (waOpened) {
    await delay(250);
    closeCheckout();
    window.location.href = 'index.html';
  }
}

function restoreCart() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(CART_KEY) || 'null'); } catch (e) { saved = null; }
  if (!Array.isArray(saved) || saved.length === 0) return;
  saved.forEach(([key, item]) => {
    if (item && typeof item.name === 'string') cartItems.set(key, item);
  });
}

function showResumePopup() {
  if (cartItems.size === 0 || document.querySelector('[data-rs]')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="rs-backdrop" data-rs-backdrop></div>
    <div class="rs-card" data-rs role="dialog" aria-modal="true" aria-labelledby="rs-title">
      <span class="rs-logo"><img src="NORTH%20FITS%20LOGO.png" alt="North Fits" /></span>
      <h3 id="rs-title">Welcome Back</h3>
      <p>You have an unfinished order in your cart. Do you want to continue it or start a new one?</p>
      <button class="btn btn-solid rs-continue" data-rs-continue>Continue Previous Order</button>
      <button class="btn btn-ghost rs-new" data-rs-new>Start New Order</button>
    </div>`;
  document.body.appendChild(wrap);

  const card = wrap.querySelector('[data-rs]');
  const backdrop = wrap.querySelector('[data-rs-backdrop]');

  const close = () => {
    card.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  wrap.querySelector('[data-rs-continue]').addEventListener('click', () => {
    close();
    openCart();
  });
  wrap.querySelector('[data-rs-new]').addEventListener('click', () => {
    cartItems.clear();
    localStorage.removeItem(CART_KEY);
    updateCartUI();
    close();
  });

  card.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

restoreCart();
updateCartUI();
window.addEventListener('load', showResumePopup);

document.querySelectorAll('[data-checkout]').forEach((btn) => {
  btn.addEventListener('click', openCheckout);
});
