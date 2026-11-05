// GROSTER — interakcje strony. Wspólny skrypt dla wszystkich podstron.
// Ścieżka kontaktu jest względna, dzięki czemu projekt działa też po otwarciu index.html.
const contactUrl = new URL(document.body.dataset.contactUrl, location.href);

// Menu na małych ekranach.
const menuButton = document.querySelector('.menu-toggle');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  document.querySelector('#navigation').classList.toggle('open', open);
});

// Rozwijane listy oferty i produktów.
document.querySelectorAll('.submenu-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.submenu-toggle').forEach(other => {
      other.setAttribute('aria-expanded', 'false');
      other.closest('.nav-group').classList.remove('expanded');
    });
    button.setAttribute('aria-expanded', String(open));
    button.closest('.nav-group').classList.toggle('expanded', open);
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  menuButton?.setAttribute('aria-expanded', 'false');
  document.querySelector('#navigation')?.classList.remove('open');
  document.querySelectorAll('.nav-group').forEach(group => group.classList.remove('expanded'));
  document.querySelectorAll('.submenu-toggle').forEach(button => button.setAttribute('aria-expanded', 'false'));
});

// Filtrowanie realizacji.
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) count++;
    });
    document.querySelectorAll('[data-filter]').forEach(other => {
      const selected = other === button;
      other.classList.toggle('selected', selected);
      other.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('.filter-status').textContent = 'Widoczne kategorie realizacji: ' + count;
  });
});

// Wyszukiwanie produktów po nazwie.
const search = document.querySelector('#product-search');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase('pl');
  let count = 0;
  document.querySelectorAll('.product-card').forEach(card => {
    card.hidden = !card.querySelector('h3').textContent.toLocaleLowerCase('pl').includes(query);
    if (!card.hidden) count++;
  });
  document.querySelector('#search-status').textContent = count
    ? 'Znalezione produkty: ' + count
    : 'Brak produktów pasujących do wyszukiwania. Spróbuj innej nazwy lub skontaktuj się z nami.';
});

// Powiększanie zdjęć w galerii.
const dialog = document.querySelector('#lightbox');
let previousFocus;
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    previousFocus = button;
    dialog.querySelector('img').src = button.dataset.image;
    dialog.querySelector('img').alt = button.dataset.alt;
    dialog.querySelector('p').textContent = button.dataset.alt;
    dialog.showModal();
  });
});
document.querySelector('#close-lightbox')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener('close', () => previousFocus?.focus());

// Uzupełnienie kontaktu po wybraniu produktu lub zabudowy.
const params = new URLSearchParams(location.search);
const subject = document.querySelector('#subject');
if (subject) subject.value = (params.get('temat') || '').slice(0, 200);
if (params.get('opis')) {
  const message = document.querySelector('[name="message"]');
  if (message) message.value = params.get('opis').slice(0, 5000);
}

// Konfigurator przygotowuje opis do zapytania o wycenę.
document.querySelector('#configuration')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const description = [
    'Pojazd: ' + data.get('vehicle'),
    'Wymiary / wersja: ' + data.get('dimensions'),
    'Rodzaj zabudowy: ' + data.get('body'),
    'Szczegóły: ' + data.get('details')
  ].join('\n');
  const target = new URL(contactUrl);
  target.search = new URLSearchParams({ temat: String(data.get('body')), opis: description }).toString();
  location.assign(target.href);
});

// Przygotowanie e-maila. Wiadomość nie jest wysyłana automatycznie.
let fileUrl;
document.querySelector('#enquiry-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  if (!String(data.get('name')).trim() || !String(data.get('message')).trim()) {
    document.querySelector('#form-status').textContent = 'Uzupełnij imię i treść wiadomości.';
    return;
  }

  const body = [
    'Dzień dobry,', '', String(data.get('message')), '',
    'Imię i nazwisko: ' + String(data.get('name')).trim(),
    'E-mail: ' + data.get('email'),
    'Telefon: ' + (data.get('phone') || 'nie podano')
  ].join('\n');
  const mailto = 'mailto:kontakt@groster.pl?subject='
    + encodeURIComponent('Zapytanie — ' + String(data.get('subject')).trim())
    + '&body=' + encodeURIComponent(body);

  if (fileUrl) URL.revokeObjectURL(fileUrl);
  const content = 'Do: kontakt@groster.pl\nTemat: ' + data.get('subject') + '\n\n' + body;
  fileUrl = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const download = document.querySelector('#download-enquiry');
  download.href = fileUrl;
  download.download = 'zapytanie-groster.txt';
  download.hidden = false;
  document.querySelector('#form-status').textContent =
    'Zapytanie jest gotowe. Dokończ wysyłkę w swoim programie pocztowym. '
    + 'Jeśli się nie otworzył, pobierz treść i wyślij ją na kontakt@groster.pl.';
  location.href = mailto;
});

// ============================================================
// DARK GARAGE — pojawianie się sekcji, galeria i wysuwany panel.
// ============================================================
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Elementy pojawiają się raz, gdy wejdą w obszar ekranu.
// Przy wyłączonym JavaScript lub ograniczonym ruchu pozostają widoczne.
const revealElements = Array.from(document.querySelectorAll([
  '.hero-copy > *', '.quick-start-strip > .container',
  '.section-heading', '.service-card', '.about-grid > div',
  '.project-preview > a', '.steps article', '.project-card', '.product-card',
  '.cta .container > div', '.page-top .container', '.enquiry-box', '.contact-form'
].join(',')));

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  revealElements.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', (index % 3) * 70 + 'ms');
    revealObserver.observe(element);
  });
  document.documentElement.classList.add('motion-ready');

  // Klawiatura nie powinna prowadzić do niewidocznego odnośnika.
  document.addEventListener('focusin', event => {
    const element = event.target.closest('.reveal');
    if (element) {
      element.classList.add('is-visible');
      revealObserver.unobserve(element);
    }
  });

  reducedMotion.addEventListener('change', event => {
    if (!event.matches) return;
    revealObserver.disconnect();
    document.documentElement.classList.remove('motion-ready');
  });
}

// Pasek postępu czytania i pomocnik pojawiający się po przewinięciu.
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.append(progressBar);
const floatingFit = document.querySelector('#floating-fit');
let scrollFrame = 0;

function updateScrollEffects() {
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = pageHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / pageHeight)) : 0;
  progressBar.style.transform = 'scaleX(' + progress + ')';
  if (floatingFit) {
    floatingFit.hidden = window.scrollY < 520 || !floatingFit.hasAttribute('aria-haspopup');
  }
  scrollFrame = 0;
}

function requestScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScrollEffects();

// Galeria na stronie głównej: zdjęcia zmienia użytkownik, bez autoplay.
const heroSlider = document.querySelector('.hero-slider');
if (heroSlider) {
  const slides = Array.from(heroSlider.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(heroSlider.querySelectorAll('[data-slide-index]'));
  const controls = heroSlider.querySelector('.slider-controls');
  let activeSlide = 0;
  let slideAnimation;

  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slideAnimation?.cancel();
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== activeSlide; });
    dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === activeSlide)));

    const current = slides[activeSlide];
    document.querySelector('#slide-name').textContent = current.dataset.slideName;
    document.querySelector('#slide-detail').textContent = current.dataset.slideDetail;
    document.querySelector('#slide-count').textContent =
      String(activeSlide + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');

    if (!reducedMotion.matches && typeof current.animate === 'function') {
      slideAnimation = current.animate([
        { opacity: 0.35, transform: 'scale(1.025)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 450, easing: 'ease-out' });
    }
  }

  dots.forEach(dot => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slideIndex))));
  heroSlider.querySelectorAll('[data-slide-direction]').forEach(button => {
    button.addEventListener('click', () => showSlide(activeSlide + Number(button.dataset.slideDirection)));
  });
  controls.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
  });
  controls.hidden = false;
}

// Wysuwany dobór zabudowy. Dialog obsługuje Tab, Escape i powrót fokusu.
const fitDrawer = document.querySelector('#fit-drawer');
if (fitDrawer && typeof fitDrawer.showModal === 'function') {
  const choices = Array.from(fitDrawer.querySelectorAll('[data-fit]'));
  const result = fitDrawer.querySelector('#fit-result');
  let drawerOpener;

  function chooseFit(choice) {
    choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    fitDrawer.querySelector('#fit-result-title').textContent = choice.dataset.fitTitle;
    fitDrawer.querySelector('#fit-result-description').textContent = choice.dataset.fitDescription;
    fitDrawer.querySelector('#fit-result-link').href = choice.dataset.fitHref;
    const target = new URL(contactUrl);
    target.search = new URLSearchParams({ temat: choice.dataset.fitTitle }).toString();
    fitDrawer.querySelector('#fit-contact-link').href = target.href;
    result.hidden = false;

    if (!reducedMotion.matches && typeof result.animate === 'function') {
      result.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 280, easing: 'ease-out' });
    }
    if (fitDrawer.open) {
      result.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  document.querySelectorAll('[data-open-fit]').forEach(opener => {
    // Pływający przycisk nadal czeka na przewinięcie strony.
    if (opener !== floatingFit) opener.hidden = false;
    opener.setAttribute('aria-haspopup', 'dialog');
    opener.setAttribute('aria-controls', 'fit-drawer');
    opener.addEventListener('click', () => {
      drawerOpener = opener;
      const preselected = choices.find(choice => choice.dataset.fit === opener.dataset.openFit);
      if (preselected) chooseFit(preselected);
      else {
        result.hidden = true;
        choices.forEach(choice => choice.setAttribute('aria-pressed', 'false'));
      }
      fitDrawer.showModal();
      fitDrawer.scrollTop = 0;
      document.documentElement.classList.add('drawer-is-open');
      if (preselected) preselected.focus();
    });
  });

  choices.forEach(choice => choice.addEventListener('click', () => chooseFit(choice)));
  document.querySelector('#close-fit').addEventListener('click', () => fitDrawer.close());
  fitDrawer.addEventListener('click', event => {
    if (event.target !== fitDrawer) return;
    const bounds = fitDrawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) fitDrawer.close();
  });
  fitDrawer.addEventListener('close', () => {
    document.documentElement.classList.remove('drawer-is-open');
    drawerOpener?.focus();
  });
  requestScrollUpdate();
}
