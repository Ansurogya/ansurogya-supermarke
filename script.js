/* =============================================
   ANSUROGYA SUPERMARKET — script.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initNavbarScrollShadow();
  initSmoothScroll();
  initScrollAnimations();
  initProductTabs();
  initContactForm();
  initSignupForm();
  initFooterYear();
  initCartSystem();
  initCheckout();
  initChatWidget();
});


/* ─── 1. NAVBAR — HAMBURGER & MOBILE MENU ─────
   Toggles the mobile nav, manages ARIA state,
   closes menu on link click and outside click.
   ─────────────────────────────────────────── */
function initNavbar() {
  const btn  = document.getElementById('hamburger-btn');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;

  function openMenu() {
    menu.classList.add('navbar__menu--open');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('hamburger--active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('navbar__menu--open');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('hamburger--active');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.contains('navbar__menu--open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close when a nav link is clicked
  menu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on click outside the header
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) closeMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}


/* ─── 2. NAVBAR SCROLL SHADOW ─────────────────
   Adds a deeper shadow to the sticky header
   once the user scrolls past the top.
   ─────────────────────────────────────────── */
function initNavbarScrollShadow() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // IntersectionObserver on a 1px sentinel at the very top
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText =
    'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('site-header--scrolled', !entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '0px' }
  );
  observer.observe(sentinel);
}


/* ─── 3. SMOOTH SCROLL (JS polyfill) ──────────
   CSS scroll-behavior:smooth handles modern
   browsers; this polyfill covers older Safari
   and anchor links blocked by framework routing.
   ─────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Move focus to the section for keyboard/screen-reader users
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    });
  });
}


/* ─── 4. SCROLL-TRIGGERED ANIMATIONS ──────────
   IntersectionObserver watches elements that have
   the class .animate-on-scroll (added in HTML).
   When they enter the viewport, .is-visible is
   added which triggers the CSS opacity/translateY
   transition. Stagger delay via CSS --delay var.
   ─────────────────────────────────────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.animate-on-scroll');
  if (!targets.length) return;

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}


/* ─── 5. PRODUCT TABS (ALL / LOCAL / IMPORTED) ─
   Filters .product-card elements by their
   data-origin attribute ("local" | "imported").
   Uses display toggle and updates ARIA states.
   ─────────────────────────────────────────── */
function initProductTabs() {
  const tabBtns     = document.querySelectorAll('.tab-btn');
  const productCards = document.querySelectorAll('.product-card');
  if (!tabBtns.length || !productCards.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      tabBtns.forEach(b => {
        b.classList.remove('tab-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('tab-btn--active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter; // "all" | "local" | "imported"

      productCards.forEach(card => {
        const show = filter === 'all' || card.dataset.origin === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}


/* ─── 6. CONTACT FORM VALIDATION ──────────────
   Client-side validation with inline error
   messages and ARIA live regions. On success
   shows a confirmation message and resets.
   Real form submission requires a backend or
   a service like Formspree (see comment below).
   ─────────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  const fields = [
    {
      inputId:  'contact-name',
      errorId:  'name-error',
      message:  'Please enter your name.',
      validate: (v) => v.trim().length >= 2,
    },
    {
      inputId:  'contact-email',
      errorId:  'email-error',
      message:  'Please enter a valid email address.',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    },
    {
      inputId:  'contact-message',
      errorId:  'message-error',
      message:  'Please enter a message (at least 10 characters).',
      validate: (v) => v.trim().length >= 10,
    },
  ];

  function clearField(field) {
    const input = document.getElementById(field.inputId);
    const error = document.getElementById(field.errorId);
    if (!input || !error) return;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    input.classList.remove('form-input--error');
  }

  function markInvalid(field) {
    const input = document.getElementById(field.inputId);
    const error = document.getElementById(field.errorId);
    if (!input || !error) return;
    error.textContent = field.message;
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('form-input--error');
  }

  // Real-time clear on input
  fields.forEach(field => {
    const input = document.getElementById(field.inputId);
    if (input) {
      input.addEventListener('input', () => clearField(field));
      input.addEventListener('blur', () => {
        if (input.value.trim() && !field.validate(input.value)) {
          markInvalid(field);
        }
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.hidden = true;

    let isValid = true;

    fields.forEach(field => {
      const input = document.getElementById(field.inputId);
      if (!input) return;
      clearField(field);
      if (!field.validate(input.value)) {
        markInvalid(field);
        isValid = false;
      }
    });

    if (!isValid) {
      // Focus first invalid field
      const firstError = form.querySelector('.form-input--error');
      if (firstError) firstError.focus();
      return;
    }

    // ── SUCCESS ────────────────────────────────
    // Replace this block with a real fetch() to
    // your backend, or use Formspree:
    //
    //   const data = new FormData(form);
    //   fetch('https://formspree.io/f/YOUR_FORM_ID', {
    //     method: 'POST',
    //     body: data,
    //     headers: { Accept: 'application/json' },
    //   })
    //   .then(r => r.ok ? showSuccess() : showError())
    //   .catch(showError);
    //
    showSuccess();
  });

  function showSuccess() {
    const form = document.getElementById('contact-form');
    form.reset();
    fields.forEach(field => clearField(field));
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { success.hidden = true; }, 7000);
  }
}


/* ─── 7. SIGN-UP FORM ──────────────────────────
   Validates username (alphanumeric + underscore,
   3+ chars), password (8+ chars), and confirm
   password match. Shows inline ARIA error messages
   and a success banner on valid submission.
   ─────────────────────────────────────────── */
function initSignupForm() {
  const form    = document.getElementById('signup-form');
  const success = document.getElementById('signup-success');
  if (!form || !success) return;

  const fields = [
    {
      inputId:  'signup-username',
      errorId:  'signup-username-error',
      message:  'Username must be 3+ characters (letters, numbers, underscores only).',
      validate: (v) => /^[a-zA-Z0-9_]{3,}$/.test(v.trim()),
    },
    {
      inputId:  'signup-password',
      errorId:  'signup-password-error',
      message:  'Password must be at least 8 characters.',
      validate: (v) => v.length >= 8,
    },
    {
      inputId:  'signup-confirm',
      errorId:  'signup-confirm-error',
      message:  'Passwords do not match.',
      validate: (v) => {
        const pw = document.getElementById('signup-password');
        return pw && v === pw.value && v.length > 0;
      },
    },
  ];

  function clearField(field) {
    const input = document.getElementById(field.inputId);
    const error = document.getElementById(field.errorId);
    if (!input || !error) return;
    error.textContent = '';
    input.removeAttribute('aria-invalid');
    input.classList.remove('form-input--error');
  }

  function markInvalid(field) {
    const input = document.getElementById(field.inputId);
    const error = document.getElementById(field.errorId);
    if (!input || !error) return;
    error.textContent = field.message;
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('form-input--error');
  }

  fields.forEach(field => {
    const input = document.getElementById(field.inputId);
    if (input) {
      input.addEventListener('input', () => clearField(field));
      input.addEventListener('blur', () => {
        if (input.value.trim() && !field.validate(input.value)) {
          markInvalid(field);
        }
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.hidden = true;
    let isValid = true;

    fields.forEach(field => {
      const input = document.getElementById(field.inputId);
      if (!input) return;
      clearField(field);
      if (!field.validate(input.value)) {
        markInvalid(field);
        isValid = false;
      }
    });

    if (!isValid) {
      const firstError = form.querySelector('.form-input--error');
      if (firstError) firstError.focus();
      return;
    }

    form.reset();
    fields.forEach(field => clearField(field));
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { success.hidden = true; }, 7000);
  });
}


/* ─── 8. FOOTER YEAR ───────────────────────────
   Inserts the current year dynamically so the
   copyright date never goes stale.
   ─────────────────────────────────────────── */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ─── 9. PRICING CARD 3D TILT ──────────────────
   Subtle perspective tilt on mousemove for the
   non-featured pricing cards. Disabled on touch
   devices and when prefers-reduced-motion is set.
   ─────────────────────────────────────────── */
function initPricingTilt() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(hover: none)').matches;
  if (prefersReduced || isTouch) return;

  const cards = document.querySelectorAll('.pricing-card:not(.pricing-card--featured)');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left)  / rect.width  - 0.5) * 14;
      const y = ((e.clientY - rect.top)   / rect.height - 0.5) * -14;
      card.style.transform =
        `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


/* ─── 10. CART SYSTEM ──────────────────────────
   Full shopping cart: add/remove/qty, sidebar,
   persisted in localStorage.
   ─────────────────────────────────────────── */
function initCartSystem() {
  // ── State ──────────────────────────────────
  let cart = loadCart();

  // ── Elements ───────────────────────────────
  const cartBtn      = document.getElementById('cart-btn');
  const cartClose    = document.getElementById('cart-close');
  const cartOverlay  = document.getElementById('cart-overlay');
  const cartSidebar  = document.getElementById('cart-sidebar');
  const cartItemsEl  = document.getElementById('cart-items');
  const cartCount    = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const checkoutBtn  = document.getElementById('checkout-btn');
  const cartShopLink = document.getElementById('cart-shop-link');

  if (!cartBtn || !cartSidebar) return;

  // ── Persistence ────────────────────────────
  function loadCart() {
    try { return JSON.parse(localStorage.getItem('ansurogya-cart') || '[]'); }
    catch { return []; }
  }
  function saveCart() {
    localStorage.setItem('ansurogya-cart', JSON.stringify(cart));
  }

  // ── Cart calculations ──────────────────────
  function totalItems() { return cart.reduce((s, i) => s + i.qty, 0); }
  function subtotal()   { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

  // ── Render sidebar ─────────────────────────
  function renderCart() {
    const count = totalItems();
    const sub   = subtotal();

    // Badge
    cartCount.textContent = count;
    cartCount.classList.toggle('bump', false);
    void cartCount.offsetWidth; // reflow
    if (count > 0) cartCount.classList.add('bump');

    // Empty / filled state
    cartSidebar.classList.toggle('cart-sidebar--empty', count === 0);

    // Items
    cartItemsEl.innerHTML = '';
    cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.setAttribute('role', 'listitem');
      el.innerHTML = `
        <img class="cart-item__img" src="${item.img}" alt="${item.name}" />
        <div class="cart-item__info">
          <p class="cart-item__name">${item.name}</p>
          <p class="cart-item__price">GH₵ ${item.price} each</p>
        </div>
        <div class="cart-item__controls">
          <button class="cart-item__qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="cart-item__qty">${item.qty}</span>
          <button class="cart-item__qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
          <button class="cart-item__remove" data-action="remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
        </div>`;
      cartItemsEl.appendChild(el);
    });

    // Subtotal
    cartSubtotal.textContent = `GH₵ ${sub.toLocaleString()}`;

    saveCart();

    // Notify checkout if open
    document.dispatchEvent(new CustomEvent('cart-updated'));
  }

  // ── Add to cart ────────────────────────────
  function addItem(id, name, price, img) {
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id, name, price: Number(price), img, qty: 1 });
    }
    renderCart();
  }

  // ── Qty / remove controls ──────────────────
  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;

    if (action === 'inc') {
      cart[idx].qty++;
    } else if (action === 'dec') {
      if (cart[idx].qty > 1) { cart[idx].qty--; }
      else { cart.splice(idx, 1); }
    } else if (action === 'remove') {
      cart.splice(idx, 1);
    }
    renderCart();
  });

  // ── Open / close sidebar ───────────────────
  function openCart() {
    cartSidebar.hidden = false;
    requestAnimationFrame(() => {
      cartSidebar.classList.add('cart-sidebar--open');
      cartOverlay.classList.add('cart-overlay--visible');
    });
    cartBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartSidebar.classList.remove('cart-sidebar--open');
    cartOverlay.classList.remove('cart-overlay--visible');
    cartBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => { cartSidebar.hidden = true; }, 320);
  }

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
  if (cartShopLink) cartShopLink.addEventListener('click', closeCart);

  // ── Wire "Add to Cart" buttons ─────────────
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    e.preventDefault();
    const { id, name, price, img } = btn.dataset;
    addItem(id, name, price, img);

    // Button feedback
    const orig = btn.textContent;
    btn.textContent = '✓ Added!';
    btn.style.background = 'var(--color-accent)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 1800);
  });

  // ── Checkout button ────────────────────────
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCart();
      setTimeout(() => document.dispatchEvent(new CustomEvent('open-checkout')), 340);
    });
  }

  // ── Expose cart to checkout ────────────────
  window._ansurCart = { getCart: () => cart, subtotal, totalItems };

  // ── Initial render ─────────────────────────
  renderCart();
}


/* ─── 11. CHECKOUT ─────────────────────────────
   Handles the checkout modal: order summary,
   delivery/collection toggle, Prime free delivery,
   MoMo or pay-at-collection, order confirmation.
   ─────────────────────────────────────────── */
function initCheckout() {
  const modal        = document.getElementById('checkout-modal');
  const closeBtn     = document.getElementById('checkout-close');
  const form         = document.getElementById('checkout-form');
  const step1        = document.getElementById('checkout-step-1');
  const step2        = document.getElementById('checkout-step-2');
  const summaryEl    = document.getElementById('checkout-summary');
  const totalEl      = document.getElementById('checkout-total-amount');
  const refEl        = document.getElementById('checkout-ref');
  const instrEl      = document.getElementById('checkout-instructions');
  const doneBtn      = document.getElementById('checkout-done');
  const feeLabel     = document.getElementById('delivery-fee-label');
  const deliveryWrap = document.getElementById('delivery-address-wrap');
  const primeCheck   = document.getElementById('co-prime');
  const deliveryRadio = document.getElementById('co-delivery');
  const collectionRadio = document.getElementById('co-collection');
  const payCollectionLabel = document.getElementById('label-pay-collection');

  const DELIVERY_FEE = 20;

  if (!modal || !form) return;

  // ── Open / close ───────────────────────────
  function openModal() {
    renderSummary();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('checkout-modal--open'));
    document.body.style.overflow = 'hidden';
    step1.hidden = false;
    step2.hidden = true;
  }
  function closeModal() {
    modal.classList.remove('checkout-modal--open');
    document.body.style.overflow = '';
    setTimeout(() => { modal.hidden = true; }, 250);
  }

  document.addEventListener('open-checkout', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // ── Render order summary ───────────────────
  function renderSummary() {
    if (!window._ansurCart) return;
    const cart = window._ansurCart.getCart();
    summaryEl.innerHTML = cart.map(i =>
      `<div class="checkout-summary-item">
        <span>${i.name} × ${i.qty}</span>
        <span>GH₵ ${(i.price * i.qty).toLocaleString()}</span>
       </div>`
    ).join('') || '<p style="font-size:0.85rem;color:#888">No items</p>';
    updateTotal();
  }

  // ── Update total ───────────────────────────
  function updateTotal() {
    if (!window._ansurCart) return;
    const sub       = window._ansurCart.subtotal();
    const isDelivery = deliveryRadio.checked;
    const isPrime    = primeCheck.checked;
    const fee        = isDelivery && !isPrime ? DELIVERY_FEE : 0;
    const total      = sub + fee;
    totalEl.textContent = `GH₵ ${total.toLocaleString()}`;

    if (feeLabel) {
      feeLabel.textContent = isPrime
        ? '★ Free delivery (Prime Member)'
        : `GH₵ ${DELIVERY_FEE} delivery fee`;
    }
  }

  // ── Show/hide delivery address & pay-at-collection ──
  function updateFulfilment() {
    const isDelivery = deliveryRadio.checked;
    deliveryWrap.style.display = isDelivery ? '' : 'none';
    // Pay at collection only available for Click & Collect
    if (payCollectionLabel) {
      payCollectionLabel.style.display = isDelivery ? 'none' : '';
    }
    updateTotal();
  }

  primeCheck.addEventListener('change', updateTotal);
  deliveryRadio.addEventListener('change', updateFulfilment);
  collectionRadio.addEventListener('change', updateFulfilment);
  updateFulfilment();

  document.addEventListener('cart-updated', () => {
    if (!modal.hidden) renderSummary();
  });

  // ── Form submission ────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const name       = document.getElementById('co-name').value.trim();
    const phone      = document.getElementById('co-phone').value.trim();
    const isPrime    = primeCheck.checked;
    const isDelivery = deliveryRadio.checked;
    const isMomo     = document.getElementById('co-momo').checked;
    const sub        = window._ansurCart ? window._ansurCart.subtotal() : 0;
    const fee        = isDelivery && !isPrime ? DELIVERY_FEE : 0;
    const total      = sub + fee;
    const ref        = 'ANS-' + Date.now().toString(36).toUpperCase();

    // Build confirmation message
    refEl.textContent = `Order ref: ${ref}`;

    if (isMomo) {
      instrEl.innerHTML = `
        <strong>Please send GH₵ ${total.toLocaleString()} via MTN MoMo:</strong><br>
        📱 Number: <strong>0552 681 380</strong><br>
        📝 Reference: <strong>${ref}</strong><br><br>
        ${isDelivery
          ? `🚚 We will call <strong>${phone}</strong> to confirm your delivery address and dispatch your order once payment is received.`
          : `🏪 Your order will be ready for collection at our Kumasi store. We will call <strong>${phone}</strong> when it's ready.`
        }<br><br>
        Thank you, <strong>${name}</strong>! We appreciate your business.`;
    } else {
      instrEl.innerHTML = `
        <strong>Your order is confirmed for collection.</strong><br><br>
        🏪 Visit our store near <strong>Central Command, Kumasi</strong>.<br>
        💳 Pay <strong>GH₵ ${total.toLocaleString()}</strong> by cash or MoMo on arrival.<br>
        📝 Show this reference: <strong>${ref}</strong><br><br>
        We will call <strong>${phone}</strong> when your order is ready.<br>
        Thank you, <strong>${name}</strong>!`;
    }

    // Clear cart
    if (window._ansurCart) {
      localStorage.removeItem('ansurogya-cart');
      window._ansurCart.getCart().length = 0;
      document.dispatchEvent(new CustomEvent('cart-updated'));
    }

    step1.hidden = true;
    step2.hidden = false;
  });

  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      closeModal();
      form.reset();
      step1.hidden = false;
      step2.hidden = true;
      updateFulfilment();
    });
  }

  // ── Validation ─────────────────────────────
  function validate() {
    let ok = true;
    const nameInput  = document.getElementById('co-name');
    const phoneInput = document.getElementById('co-phone');
    const addrInput  = document.getElementById('co-address');

    clearError('co-name-error');
    clearError('co-phone-error');
    clearError('co-address-error');

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError('co-name-error', 'Please enter your name.');
      nameInput.classList.add('error');
      ok = false;
    }
    if (!/^0\d{9}$/.test(phoneInput.value.trim())) {
      showError('co-phone-error', 'Enter a valid Ghana phone number (e.g. 0241234567).');
      phoneInput.classList.add('error');
      ok = false;
    }
    if (deliveryRadio.checked && !addrInput.value.trim()) {
      showError('co-address-error', 'Please enter your delivery address.');
      addrInput.classList.add('error');
      ok = false;
    }
    return ok;
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; }
    const input = el && el.previousElementSibling;
    if (input) input.classList.remove('error');
  }

  // Clear errors on input
  ['co-name','co-phone','co-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('error');
    });
  });
}


/* ─── 13. AI CHAT WIDGET ───────────────────────
   Floating chat assistant with keyword-based
   responses about the store, products, hours,
   MoMo payment, laptops, and contact info.
   ─────────────────────────────────────────── */
function initChatWidget() {
  const widget  = document.getElementById('chat-widget');
  const toggle  = document.getElementById('chat-toggle');
  const panel   = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const form    = document.getElementById('chat-form');
  const input   = document.getElementById('chat-input');
  const msgBox  = document.getElementById('chat-messages');
  const quickBox = document.getElementById('chat-quick');
  if (!widget || !toggle || !panel || !form) return;

  // ── Knowledge base ─────────────────────────
  const KB = [
    {
      keys: ['hour', 'open', 'close', 'time', 'when'],
      answer: 'We are open Monday – Saturday 7 am to 9 pm, and Sunday 8 am to 6 pm. We are closed on public holidays.'
    },
    {
      keys: ['location', 'address', 'where', 'find', 'kumasi', 'direction'],
      answer: 'Ansurogya Supermarket is located at Kumasi Central Command, Kumasi, Ghana. See the map on our website for directions.'
    },
    {
      keys: ['momo', 'payment', 'pay', 'mobile money', 'number', '0552', '0553'],
      answer: 'You can pay via MTN Mobile Money. Send payment to: 0552 681 380. Quote your order number in the reference.'
    },
    {
      keys: ['deliver', 'delivery', 'ship', 'shipping'],
      answer: 'We offer same-day delivery within Kumasi. Order before 12 pm for delivery by 6 pm. Call +233 249 878 467 for delivery enquiries.'
    },
    {
      keys: ['laptop', 'dell', 'computer', 'pc', 'latitud', 'business laptop'],
      answer: 'We stock the Dell Latitude 7320 Touch (GH₵ 6,000) and a Business Laptop (GH₵ 6,500). Both come with Windows 11. Call us or WhatsApp to order!'
    },
    {
      keys: ['price', 'cost', 'how much', 'cheap', 'expensive', 'ghc', 'cedi'],
      answer: 'Our prices are very competitive! Browse the Groceries and Products sections on the site, or call +233 249 878 467 for a specific item price.'
    },
    {
      keys: ['contact', 'phone', 'call', 'whatsapp', 'email', 'reach'],
      answer: 'You can reach us at:\n📞 +233 249 878 467\n💬 WhatsApp us at the same number\nOr use the Contact form on this page.'
    },
    {
      keys: ['grocery', 'groceries', 'food', 'fresh', 'produce', 'vegetable', 'fruit'],
      answer: 'We stock a wide range of fresh groceries, imported brands, and local produce — all at great prices. Visit us or browse the Groceries section on the site.'
    },
    {
      keys: ['local', 'imported', 'brand', 'product', 'biscoff', 'oil', 'juice'],
      answer: 'We carry both local Ghanaian products and premium imported brands. Use the tabs in our Products section to filter by local or imported.'
    },
    {
      keys: ['click', 'collect', 'pickup', 'pick up', 'order online'],
      answer: 'Our Click & Collect service is simple: browse online, place your order, and pick it up in-store — usually ready within 2 hours!'
    },
    {
      keys: ['membership', 'plan', 'subscription', 'monthly', 'unlimited', 'drop'],
      answer: 'We offer three plans: Drop-in (pay as you go), Monthly (GH₵ 49/month), and Unlimited (GH₵ 89/month). See the Pricing section for full details.'
    },
    {
      keys: ['sign up', 'register', 'account', 'join'],
      answer: 'You can create a free account using the Sign Up section at the bottom of the page. Just enter a username and password — it only takes a minute!'
    },
    {
      keys: ['thank', 'thanks', 'bye', 'goodbye', 'cheers'],
      answer: 'Thank you for chatting with us! Feel free to ask anything else. Have a great day!'
    },
    {
      keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'howdy'],
      answer: 'Hello! Welcome to Ansurogya Supermarket. How can I help you today? You can ask about our products, hours, delivery, MoMo payment, laptops, or anything else!'
    },
  ];

  const FALLBACK = "I'm not sure about that — please call us at +233 249 878 467 or use the Contact form on this page and our team will be happy to help!";

  const QUICK_QUESTIONS = [
    'Opening hours',
    'MoMo payment',
    'Delivery',
    'Laptops',
    'Contact us',
  ];

  // ── Helpers ────────────────────────────────
  function getAnswer(text) {
    const lower = text.toLowerCase();
    for (const item of KB) {
      if (item.keys.some(k => lower.includes(k))) return item.answer;
    }
    return FALLBACK;
  }

  function appendMsg(text, type) {
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-msg--${type}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-msg__bubble';
    // Allow \n line breaks
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    msg.appendChild(bubble);
    msgBox.appendChild(msg);
    msgBox.scrollTop = msgBox.scrollHeight;
    return msg;
  }

  function showTyping() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--bot chat-typing';
    msg.innerHTML = '<div class="chat-msg__bubble"><span class="chat-dot"></span><span class="chat-dot"></span><span class="chat-dot"></span></div>';
    msgBox.appendChild(msg);
    msgBox.scrollTop = msgBox.scrollHeight;
    return msg;
  }

  function botReply(userText) {
    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      appendMsg(getAnswer(userText), 'bot');
    }, 700 + Math.random() * 400);
  }

  function buildQuickBtns() {
    quickBox.innerHTML = '';
    QUICK_QUESTIONS.forEach(q => {
      const b = document.createElement('button');
      b.className = 'chat-quick-btn';
      b.textContent = q;
      b.addEventListener('click', () => {
        appendMsg(q, 'user');
        botReply(q);
        quickBox.innerHTML = ''; // hide after first use
      });
      quickBox.appendChild(b);
    });
  }

  // ── Open / close ───────────────────────────
  let opened = false;

  function openPanel() {
    panel.hidden = false;
    widget.classList.add('chat-widget--open');
    toggle.setAttribute('aria-expanded', 'true');

    if (!opened) {
      opened = true;
      appendMsg('Hi there! I\'m the Ansurogya Assistant. How can I help you today?', 'bot');
      buildQuickBtns();
    }

    setTimeout(() => input.focus(), 50);
  }

  function closePanel() {
    widget.classList.remove('chat-widget--open');
    toggle.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 220); // wait for CSS transition
  }

  toggle.addEventListener('click', () => {
    widget.classList.contains('chat-widget--open') ? closePanel() : openPanel();
  });

  closeBtn.addEventListener('click', closePanel);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('chat-widget--open')) closePanel();
  });

  // ── Send message ───────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMsg(text, 'user');
    input.value = '';
    quickBox.innerHTML = '';
    botReply(text);
  });
}
