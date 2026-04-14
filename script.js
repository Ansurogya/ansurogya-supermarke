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
  initPricingTilt();
  initCartButtons();
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


/* ─── 10. CART BUTTONS (DEMO) ──────────────────
   Provides visual feedback for "Add to Cart"
   clicks. In a real implementation these would
   update a cart state/store.
   ─────────────────────────────────────────── */
function initCartButtons() {
  document.querySelectorAll('.product-card__add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const originalText = btn.textContent;
      btn.textContent = '✓ Added!';
      btn.style.background = 'var(--color-accent)';
      btn.style.borderColor = 'var(--color-accent)';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.disabled = false;
      }, 2000);
    });
  });
}


/* ─── 11. AI CHAT WIDGET ───────────────────────
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
