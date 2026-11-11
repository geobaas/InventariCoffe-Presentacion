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

  // Convierte un destino en índice: número de diapositiva ("3") o el id
  // de su <section> ("contacto"). Con el id, reordenar no rompe los enlaces.
  function indiceDe(destino) {
    const n = parseInt(destino, 10);
    if (!isNaN(n)) return n - 1;
    return slides.findIndex(s => s.id === destino);
  }

  // Botones dentro de las diapositivas con data-ir="contacto" o data-ir="12"
  document.querySelectorAll('[data-ir]').forEach(el => {
    el.addEventListener('click', () => {
      const i = indiceDe(el.dataset.ir);
      if (i >= 0) ir(i);
    });
  });

  // Pantalla completa con botón (tablet) o tecla F (computadora).
  // Safari de iPad usa los nombres con prefijo "webkit".
  const raiz = document.documentElement;
  const botonPantalla = document.getElementById('pantalla');
  const pedirPantalla = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
  const salirPantalla = document.exitFullscreen || document.webkitExitFullscreen;

  function enPantalla() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function alternarPantalla() {
    if (!pedirPantalla) return;
    if (enPantalla()) salirPantalla.call(document);
    else pedirPantalla.call(raiz);
  }

  function actualizarBotonPantalla() {
    const dentro = enPantalla();
    raiz.classList.toggle('en-pantalla', dentro);
    const texto = dentro ? 'Salir de pantalla completa' : 'Pantalla completa';
    botonPantalla.setAttribute('aria-label', texto);
    botonPantalla.title = texto;
  }

  // El iPhone no permite pantalla completa en páginas: ahí el botón no aparece
  if (pedirPantalla) {
    botonPantalla.hidden = false;
    botonPantalla.addEventListener('click', alternarPantalla);
    document.addEventListener('fullscreenchange', actualizarBotonPantalla);
    document.addEventListener('webkitfullscreenchange', actualizarBotonPantalla);
  }

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
        alternarPantalla();
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

  // Enlaces como href="#1" o href="#contacto"
  window.addEventListener('hashchange', () => {
    const i = indiceDe(location.hash.slice(1));
    if (i >= 0 && i !== actual) ir(i);
  });

  const inicial = indiceDe(location.hash.slice(1));
  ir(inicial >= 0 ? inicial : 0);
})();

// Chat de WhatsApp: al entrar a la diapositiva los mensajes llegan uno por
// uno y, antes de cada respuesta del asistente, aparecen los tres puntos
// de "escribiendo…". Al volver a la diapositiva la conversación se repite.
(function () {
  const slide = document.getElementById('whatsapp');
  if (!slide) return;
  const chat = slide.querySelector('.chat');
  const mensajes = Array.from(chat.querySelectorAll('.msg'));
  const tarjeta = slide.querySelector('.pedido-card');
  const estado = slide.querySelector('.tel-estado');
  const puntos = chat.querySelector('.escribiendo');
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendientes = [];
  let activa = false;

  function despues(ms, fn) { pendientes.push(setTimeout(fn, ms)); }

  function cancelar() {
    pendientes.forEach(clearTimeout);
    pendientes = [];
  }

  function escribiendo(si, msg) {
    if (si) puntos.style.top = msg.offsetTop + 'px';
    puntos.classList.toggle('visible', si);
    estado.textContent = si ? 'escribiendo…' : 'en línea';
    estado.classList.toggle('escribiendo-txt', si);
  }

  function ocultarTodo() {
    escribiendo(false);
    mensajes.forEach(m => m.classList.remove('visible'));
    tarjeta.classList.remove('visible');
  }

  function reproducir() {
    cancelar();
    ocultarTodo();
    if (sinMovimiento.matches) {
      mensajes.forEach(m => m.classList.add('visible'));
      tarjeta.classList.add('visible');
      return;
    }
    let t = 600;
    mensajes.forEach(msg => {
      if (msg.classList.contains('bot')) {
        // Respuestas largas "se escriben" un poco más de tiempo
        const tecleo = Math.min(2200, 900 + msg.textContent.length * 12);
        despues(t, () => escribiendo(true, msg));
        t += tecleo;
        despues(t, () => { escribiendo(false); msg.classList.add('visible'); });
        t += 900;
      } else {
        despues(t, () => msg.classList.add('visible'));
        t += 700;
      }
    });
    despues(t, () => tarjeta.classList.add('visible'));
  }

  function salir() {
    cancelar();
    escribiendo(false);
    // Espera a que la diapositiva termine de irse antes de vaciar el chat
    despues(700, ocultarTodo);
  }

  new MutationObserver(() => {
    const ahora = slide.classList.contains('activa');
    if (ahora === activa) return;
    activa = ahora;
    if (ahora) reproducir(); else salir();
  }).observe(slide, { attributes: true, attributeFilter: ['class'] });

  if (slide.classList.contains('activa')) { activa = true; reproducir(); }
})();

// Números que suben: al entrar a una diapositiva, las cifras de los paneles
// (ventas, métricas, pérdidas, montos) cuentan desde 0 hasta su valor real.
// El valor final está escrito en el HTML; aquí solo se anima.
(function () {
  const SELECTOR = '.kpi b, .metrica b, .fuga-cifra b, .balance-monto';
  const DURACION = 1600;   // ms
  const ESPERA = 450;      // ms: deja que la diapositiva termine de entrar
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Guarda, para cada cifra, el texto donde está el número y cómo escribirlo
  function preparar(el) {
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let nodo;
    while ((nodo = caminante.nextNode())) {
      const m = nodo.nodeValue.match(/^(.*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s);
      if (!m) continue;
      const decimales = (m[2].split('.')[1] || '').length;
      return {
        el, nodo,
        antes: m[1], despues: m[3],
        valor: parseFloat(m[2].replace(/,/g, '')),
        comas: m[2].includes(','),
        decimales,
        original: nodo.nodeValue
      };
    }
    return null;
  }

  function escribir(c, n) {
    const texto = c.comas
      ? n.toLocaleString('en-US', { minimumFractionDigits: c.decimales, maximumFractionDigits: c.decimales })
      : n.toFixed(c.decimales);
    c.nodo.nodeValue = c.antes + texto + c.despues;
  }

  const porSlide = new Map();
  document.querySelectorAll(SELECTOR).forEach(el => {
    const slide = el.closest('.slide');
    const c = preparar(el);
    if (!slide || !c) return;
    if (!porSlide.has(slide)) porSlide.set(slide, []);
    porSlide.get(slide).push(c);
  });

  porSlide.forEach((cifras, slide) => {
    let cuadro = null, inicio = null, activa = false;

    function terminar() {
      cancelAnimationFrame(cuadro);
      clearTimeout(inicio);
      cifras.forEach(c => { c.nodo.nodeValue = c.original; c.el.style.minWidth = ''; });
    }

    function contar() {
      terminar();
      if (sinMovimiento.matches) return;
      // Reserva el ancho final para que nada se mueva mientras cuenta
      cifras.forEach(c => { c.el.style.minWidth = c.el.offsetWidth + 'px'; escribir(c, 0); });
      inicio = setTimeout(() => {
        const t0 = performance.now();
        function paso(ahora) {
          const p = Math.min(1, (ahora - t0) / DURACION);
          const suave = 1 - Math.pow(1 - p, 4); // rápido al inicio, frena al final
          cifras.forEach(c => escribir(c, c.decimales ? c.valor * suave : Math.floor(c.valor * suave)));
          if (p < 1) cuadro = requestAnimationFrame(paso);
          else terminar();
        }
        cuadro = requestAnimationFrame(paso);
      }, ESPERA);
    }

    new MutationObserver(() => {
      const ahora = slide.classList.contains('activa');
      if (ahora === activa) return;
      activa = ahora;
      if (ahora) contar(); else terminar();
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });

    if (slide.classList.contains('activa')) { activa = true; contar(); }
  });
})();
