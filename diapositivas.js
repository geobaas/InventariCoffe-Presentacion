// Modo claro/oscuro: alterna data-theme="light" en <html> y guarda la
// preferencia en localStorage. Sin el atributo se usa el modo oscuro.
(function () {
  const CLAVE = 'inventaricoffe-tema';
  const raiz = document.documentElement;
  const boton = document.getElementById('tema');
  let temporizador;

  function leerTema() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  function guardarTema(tema) {
    try { localStorage.setItem(CLAVE, tema); } catch (e) { /* modo privado o almacenamiento bloqueado */ }
  }

  function aplicarTema(tema) {
    const claro = tema === 'light';
    if (claro) raiz.setAttribute('data-theme', 'light');
    else raiz.removeAttribute('data-theme');
    const texto = claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';
    boton.setAttribute('aria-label', texto);
    boton.title = texto;
  }

  function alternarTema() {
    const nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    // Clase temporal para que los colores cambien con una transición suave
    raiz.classList.add('cambiando-tema');
    aplicarTema(nuevo);
    guardarTema(nuevo);
    clearTimeout(temporizador);
    temporizador = setTimeout(() => raiz.classList.remove('cambiando-tema'), 450);
  }

  aplicarTema(leerTema() === 'light' ? 'light' : 'dark');
  boton.addEventListener('click', alternarTema);
})();

// Navegación de diapositivas: teclado, botones, puntos, deslizar en celular
// y el número de diapositiva en la URL (#3) para compartir o recargar.
(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const puntos = document.getElementById('puntos');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const barra = document.getElementById('barra');
  const actualEl = document.getElementById('actual');
  document.getElementById('total').textContent = total;

  let actual = 0;

  slides.forEach((slide, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Ir a ' + (slide.dataset.titulo || 'diapositiva ' + (i + 1)));
    b.addEventListener('click', () => ir(i));
    puntos.appendChild(b);
  });

  function ir(n) {
    n = Math.max(0, Math.min(total - 1, n));
    slides.forEach((s, i) => {
      s.classList.toggle('activa', i === n);
      s.classList.toggle('previa', i < n);
      s.setAttribute('aria-hidden', i === n ? 'false' : 'true');
    });
    // Pausa el video si salimos de su diapositiva
    slides.forEach((s, i) => {
      if (i !== n) s.querySelectorAll('video').forEach(v => v.pause());
    });
    Array.from(puntos.children).forEach((p, i) => p.classList.toggle('activo', i === n));
    actual = n;
    actualEl.textContent = n + 1;
    barra.style.width = ((n + 1) / total) * 100 + '%';
    prev.disabled = n === 0;
    next.disabled = n === total - 1;
    slides[n].scrollTop = 0;
    if (location.hash !== '#' + (n + 1)) history.replaceState(null, '', '#' + (n + 1));
  }

  prev.addEventListener('click', () => ir(actual - 1));
  next.addEventListener('click', () => ir(actual + 1));

  // Botones dentro de las diapositivas con data-ir="12"
  document.querySelectorAll('[data-ir]').forEach(el => {
    el.addEventListener('click', () => ir(parseInt(el.dataset.ir, 10) - 1));
  });

  document.addEventListener('keydown', e => {
    if (e.target.closest('video, input, textarea')) return;
    // Espacio/Enter sobre un botón o enlace lo activa, no cambia de diapositiva
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('button, a')) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ':
        e.preventDefault(); ir(actual + 1); break;
      case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); ir(actual - 1); break;
      case 'Home': ir(0); break;
      case 'End': ir(total - 1); break;
      case 'f': case 'F':
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;
    }
  });

  // Deslizar con el dedo
  let x0 = null, y0 = null;
  document.addEventListener('touchstart', e => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(actual + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  });

  // Enlaces como href="#1"
  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) ir(n - 1);
  });

  const inicial = parseInt(location.hash.slice(1), 10);
  ir(isNaN(inicial) ? 0 : inicial - 1);
})();
