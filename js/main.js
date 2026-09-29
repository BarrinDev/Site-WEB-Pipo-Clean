/* Pipo Clean — o scroll é a escova (GSAP + ScrollTrigger + Lenis + SplitType) */
(() => {
  const raiz = document.documentElement;
  const um = (s, c = document) => c.querySelector(s);
  const todos = (s, c = document) => [...c.querySelectorAll(s)];
  const cenas = todos('.cena');
  let inicios = [];
  let rolarPara = (y) => window.scrollTo({ top: y });
  let travar = () => {};
  let soltar = () => {};

  /* Fotos que ainda não existem viram espaço reservado com legenda */
  todos('.frame img').forEach((img) => {
    const f = img.closest('.frame');
    img.addEventListener('error', () => f.classList.add('vazio'));
    img.addEventListener('load', () => f.classList.remove('vazio'));
    if (img.complete && img.naturalWidth === 0) f.classList.add('vazio');
  });

  montarMenu();

  if (!raiz.classList.contains('motion') || !(window.gsap && window.ScrollTrigger && window.Lenis)) {
    raiz.classList.remove('motion');
    raiz.classList.add('parado');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const lenis = new Lenis({ lerp: 0.085 });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  rolarPara = (y) => lenis.scrollTo(y, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 3) });
  travar = () => lenis.stop();
  soltar = () => lenis.start();
  window.__rolar = rolarPara;

  /* ---------- Preloader: a escova limpa a faixa conforme carrega ---------- */
  const sujo = um('.pre-sujo');
  const escovaPre = um('.pre-escova');
  const num = um('.pre-num');
  const carga = { p: 0 };
  const limpar = () => {
    sujo.style.clipPath = `inset(0 0 0 ${carga.p * 100}%)`;
    escovaPre.style.transform = `translateX(${carga.p * innerWidth - 13}px)`;
    num.textContent = `${Math.round(carga.p * 100)}%`;
  };
  const noMaximo = (p) => Promise.race([p, new Promise((ok) => setTimeout(ok, 7000))]);
  const imagem = (img) => new Promise((ok) => {
    if (!img || img.complete) return ok();
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', ok, { once: true });
  });
  const fontes = document.fonts ? document.fonts.ready : Promise.resolve();
  const tarefas = [
    fontes,
    imagem(um('.ab-foto img')),
    new Promise((ok) => (document.readyState === 'complete' ? ok() : addEventListener('load', ok, { once: true }))),
  ].map(noMaximo);
  let feitas = 0;
  let passada = gsap.to(carga, { p: 0.12, duration: 0.8, onUpdate: limpar });
  tarefas.forEach((t) => t.then(() => {
    feitas++;
    passada.kill();
    passada = gsap.to(carga, { p: feitas / tarefas.length, duration: 0.9, ease: 'power1.inOut', onUpdate: limpar });
  }));

  fontes.then(() => {
    if (window.SplitType) {
      todos('[data-split]').forEach((el) => new SplitType(el, { types: 'lines,words' }));
      todos('[data-chars]').forEach((el) => new SplitType(el, { types: 'chars' }));
    }
    montarCenas();
  });

  Promise.all(tarefas).then(() => gsap.delayedCall(0.8, entrar));

  function entrar() {
    ScrollTrigger.refresh();
    gsap.timeline({ onComplete: () => { um('.pre').remove(); soltar(); } })
      .to(carga, { p: 1, duration: 0.35, onUpdate: limpar })
      .to(escovaPre, { x: innerWidth + 40, duration: 0.3 })
      .to('.pre-logo', { scale: 0.92, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.35')
      .to('.pre', { opacity: 0, duration: 0.6 })
      .from('.ab-nome .char', { yPercent: 90, opacity: 0, stagger: 0.04, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.3')
      .from('.ab-sub .word', { opacity: 0, y: 10, stagger: 0.06, duration: 0.5 }, '-=0.5')
      .to(['.topo', '.prog', '.zap'], { opacity: 1, duration: 0.5 }, '-=0.4');
  }

  /* ---------- Cenas ---------- */
  function montarCenas() {
    gsap.matchMedia().add({ desk: '(min-width: 769px)', mob: '(max-width: 768px)' }, (ctx) => {
      const { desk } = ctx.conditions;
      abertura();
      antesDepois();
      servicos(desk);
      comoFunciona();
      varal();
      final();
    });
    progresso();
  }

  const fixa = (alvo, fim) => ({ trigger: alvo, start: 'top top', end: fim, scrub: 1, pin: true, invalidateOnRefresh: true });

  // 1 · A mancha se dissolve, a fachada aparece pela "porta da máquina".
  // Saída: a foto sobe como porta de enrolar.
  function abertura() {
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: fixa('#abertura', '+=320%') })
      .to('.m', { scale: 0, opacity: 0, transformOrigin: '50% 50%', stagger: 0.18, duration: 0.9, ease: 'power2.in' }, 0)
      .to('.bolha', { keyframes: [{ scale: 1, duration: 0.25 }, { scale: 1.3, opacity: 0, duration: 0.2 }], stagger: 0.2 }, 0.25)
      .from('.ab-linha .word', { opacity: 0, y: 8, stagger: 0.03, duration: 0.3 }, 0.6)
      .fromTo('.ab-foto', { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1, ease: 'power2.inOut' }, 1.5)
      .fromTo('.ab-foto img', { scale: 1.25 }, { scale: 1, duration: 1.3 }, 1.5)
      .from('.ab-foto-leg', { opacity: 0, y: 12, duration: 0.3 }, 2.4)
      .set(['.tecido', '.ab-tit', '.ab-linha'], { autoAlpha: 0 }, 2.6)
      .to({}, { duration: 0.3 })
      .to('.ab-foto', { yPercent: -100, duration: 0.8, ease: 'power2.inOut' });
  }

  // 2 · Cena principal: a escova passa em diagonal e troca o antes pelo depois.
  // Também funciona arrastando a foto com o dedo ou o mouse.
  // Saída: centrifugação — tudo gira e encolhe.
  function antesDepois() {
    const pares = todos('.par');
    const estados = pares.map(() => ({ v: 0 }));
    const TOPO = 118;
    const INCLINA = 18;
    const aplicar = (i) => {
      const par = pares[i];
      const caixa = um('.par-foto', par);
      const X = estados[i].v * TOPO;
      um('.par-depois', par).style.clipPath = `polygon(0% 0%, ${X}% 0%, ${X - INCLINA}% 100%, 0% 100%)`;
      const W = caixa.offsetWidth;
      const H = caixa.offsetHeight;
      const ang = Math.atan2((INCLINA / 100) * W, H) * (180 / Math.PI);
      um('.escova', par).style.transform = `translateX(${((X - INCLINA / 2) / 100) * W - 13}px) rotate(${ang}deg)`;
    };
    gsap.set(pares, { xPercent: -50, yPercent: -50 });
    pares.forEach((_, i) => aplicar(i));

    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: fixa('#antes-depois', `+=${pares.length * 140 + 80}%`) });
    tl.fromTo('.ad-cab', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
    pares.forEach((par, i) => {
      const t = 0.2 + i * 2.2;
      if (i) tl.fromTo(par, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4 }, t);
      else tl.set(par, { opacity: 1 }, 0);
      tl.fromTo(estados[i], { v: 0 }, { v: 1, duration: 1.3, ease: 'sine.inOut', onUpdate: () => aplicar(i) }, t + 0.3);
      if (i < pares.length - 1) tl.to(par, { opacity: 0, y: -40, duration: 0.4 }, t + 1.9);
    });
    tl.set(pares.slice(1), { opacity: 0 }, 0);
    tl.to({}, { duration: 0.3 })
      .to('.pares', { rotation: -35, scale: 0.35, opacity: 0, duration: 0.9, ease: 'power2.in' })
      .fromTo('.ad-cab', { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, '<');

    // arrastar com o dedo/mouse
    pares.forEach((par, i) => {
      const caixa = um('.par-foto', par);
      let ativo = false;
      const mover = (e) => {
        const r = caixa.getBoundingClientRect();
        estados[i].v = gsap.utils.clamp(0, 1, ((e.clientX - r.left) / r.width) * (100 + INCLINA / 2) / TOPO + 0.02);
        aplicar(i);
      };
      caixa.addEventListener('pointerdown', (e) => { ativo = true; caixa.setPointerCapture(e.pointerId); mover(e); });
      caixa.addEventListener('pointermove', (e) => { if (ativo) mover(e); });
      const fim = () => { ativo = false; };
      caixa.addEventListener('pointerup', fim);
      caixa.addEventListener('pointercancel', fim);
    });
  }

  // 3 · Um serviço por vez. Saída: um painel azul-marinho "desdobra" de cima.
  function servicos(desk) {
    const itens = todos('.serv');
    const R = 'round 200px 200px 24px 24px';
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: fixa('#maquinas', `+=${itens.length * 110 + 60}%`) });
    tl.from('.serv-tit', { opacity: 0, duration: 0.2 }, 0);
    itens.forEach((it, i) => {
      const t = i * 1.8 + 0.1;
      const foto = um('.serv-foto', it);
      const pal = todos('.serv-nome .word', it);
      const meta = [um('.serv-n', it), um('.serv-o-que', it), um('.serv-dados', it)];
      tl.fromTo(foto, { clipPath: `inset(100% 0% 0% 0% ${R})` }, { clipPath: `inset(0% 0% 0% 0% ${R})`, duration: 0.7, ease: 'power2.out' }, t)
        .fromTo(um('img', foto), { scale: 1.2 }, { scale: 1, duration: 1.1 }, t)
        .fromTo(pal, { opacity: 0, x: desk ? 60 : 30 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out' }, t + 0.2)
        .fromTo(meta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.35 }, t + 0.35);
      if (i < itens.length - 1) {
        tl.to(foto, { clipPath: `inset(0% 0% 100% 0% ${R})`, duration: 0.5, ease: 'power2.in' }, t + 1.35)
          .to([...pal, ...meta], { opacity: 0, duration: 0.3 }, t + 1.35);
      }
    });
    tl.to({}, { duration: 0.3 })
      .fromTo('.dobra', { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'power2.inOut' });
  }

  // 4 · O tambor gira com o scroll e acende um passo por vez.
  // Saída: um rodo passa da direita pra esquerda e deixa a tela limpa.
  function comoFunciona() {
    const passos = todos('.passo');
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: fixa('#como-funciona', '+=320%') });
    tl.from('.tambor', { scale: 0.7, opacity: 0, duration: 0.4 }, 0)
      .from('.como-tit .word', { yPercent: 110, stagger: 0.08, duration: 0.4 }, 0.1)
      .to('.tambor-giro', { rotation: 1080, duration: 3.2 }, 0);
    passos.forEach((p, i) => {
      const t = 0.5 + i * 0.65;
      tl.to(p, { opacity: 1, duration: 0.2 }, t);
      if (i) tl.to(passos[i - 1], { opacity: 0.55, duration: 0.2 }, t);
    });
    tl.to({}, { duration: 0.3 })
      .fromTo('.rodo-barra', { x: () => innerWidth }, { x: -30, duration: 0.9, ease: 'power1.inOut' })
      .fromTo('.rodo-cobre', { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power1.inOut' }, '<');
  }

  // 5 · O fio do varal se estica e as etiquetas são penduradas.
  // Saída: "Onde fica" sobe por cima (margem negativa no CSS).
  function varal() {
    const giro = [-4, 3, -2, 4, -3];
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: fixa('#quando', '+=300%') })
      .from('.varal-tit .word', { yPercent: 110, stagger: 0.06, duration: 0.4 }, 0)
      .fromTo('.varal-fio', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 }, 0.2)
      .fromTo('.etq', { rotation: -95, opacity: 0 }, { rotation: (i) => giro[i], opacity: 1, stagger: 0.3, duration: 0.6, ease: 'back.out(1.7)' }, 0.6)
      .to({}, { duration: 1.4 });
  }

  // 7 · O fundo escurece enquanto a última cena chega.
  function final() {
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#final', start: 'top 85%', end: 'top 15%', scrub: 1 } })
      .to('.final-fundo', { opacity: 1, duration: 1 }, 0)
      .from('.final-tit .word', { opacity: 0, stagger: 0.08, duration: 0.3 }, 0.5);
  }

  /* ---------- Progresso ---------- */
  function inicio(sec) {
    const el = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec;
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function progresso() {
    const marcas = todos('.prog-marcas li');
    const cheio = um('.prog-cheio');
    const deitado = () => innerWidth <= 768;
    const medir = () => {
      const max = ScrollTrigger.maxScroll(window) || 1;
      inicios = cenas.map(inicio);
      marcas.forEach((li, i) => { li.style.top = `${Math.min(inicios[i] / max, 1) * 100}%`; });
    };
    ScrollTrigger.addEventListener('refresh', medir);
    medir();
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (s) => {
        cheio.style.transform = deitado() ? `scaleX(${s.progress})` : `scaleY(${s.progress})`;
        const y = window.scrollY + innerHeight * 0.45;
        let atual = 0;
        inicios.forEach((p, i) => { if (y >= p) atual = i; });
        destacar(atual);
      },
    });
  }

  /* ---------- Menu ---------- */
  function destacar(i) {
    todos('.prog-marcas li').forEach((li, j) => li.classList.toggle('atual', j === i));
    todos('.mapa-lista li').forEach((li, j) => {
      um('.aqui', li).hidden = j !== i;
      um('a', li).toggleAttribute('aria-current', j === i);
    });
  }

  function irPara(i) {
    rolarPara(inicios[i] ?? inicio(cenas[i]));
  }

  function montarMenu() {
    const lista = um('.mapa-lista');
    const marcas = um('.prog-marcas');
    cenas.forEach((sec, i) => {
      const nome = sec.dataset.nome;
      lista.insertAdjacentHTML('beforeend',
        `<li><a href="#${sec.id}"><span class="mapa-n">${i + 1}</span><span class="mapa-nome">${nome}</span><span class="aqui"${i ? ' hidden' : ''}>você está aqui</span></a></li>`);
      marcas.insertAdjacentHTML('beforeend',
        `<li${i ? '' : ' class="atual"'}><button type="button" aria-label="Ir para ${nome}"><span class="rotulo">${nome}</span></button></li>`);
    });

    const mapa = um('#mapa');
    const btn = um('.menu-btn');
    const animado = () => raiz.classList.contains('motion');
    const abrir = () => {
      mapa.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      travar();
      if (window.gsap && animado()) gsap.fromTo('.mapa-lista li', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.4 });
      um('.mapa-fechar').focus();
    };
    const fechar = (foco = true) => {
      mapa.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      soltar();
      if (foco) btn.focus();
    };
    btn.addEventListener('click', abrir);
    um('.mapa-fechar').addEventListener('click', () => fechar());
    mapa.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fechar();
      if (e.key !== 'Tab') return;
      const f = todos('button, a', mapa);
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    todos('.mapa-lista a').forEach((a, i) => a.addEventListener('click', (e) => {
      fechar(false);
      if (!animado()) return;
      e.preventDefault();
      irPara(i);
    }));
    todos('.prog-marcas button').forEach((b, i) => b.addEventListener('click', () => irPara(i)));
    um('.marca').addEventListener('click', (e) => {
      if (!animado()) return;
      e.preventDefault();
      irPara(0);
    });
  }
})();
