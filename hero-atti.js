(() => {
  const show = document.querySelector("[data-hx]");
  if (!show) return;
  const palco = show.querySelector(".hx-palco");
  const titoli = [...show.querySelectorAll("[data-atto-t]")];
  const bolle = [...show.querySelectorAll(".hx-dialogo p")];
  const atti = [...show.querySelectorAll(".hx-atti li")];
  const foto = show.querySelector(".hx-foto"), alone = show.querySelector(".hx-alone"), agenda = show.querySelector(".hx-agenda");
  const calma = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let p = 0, atto = 1;

  function progresso() {
    const r = show.getBoundingClientRect();
    p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    // atto 1 breve: la prima scrollata cambia gia' qualcosa
    const nuovo = p < .1 ? 1 : p < .5 ? 2 : 3;
    palco.style.setProperty("--p1", Math.min(1, p / .1));
    // ultimo tratto: la hero sfuma nel bianco della sezione dopo
    palco.style.setProperty("--sf", Math.max(0, Math.min(1, (p - .84) / .16)));
    if (nuovo !== atto) {
      titoli.forEach(t => { const n = +t.dataset.attoT; t.classList.toggle("on", n === nuovo); t.classList.toggle("via", n < nuovo); if (n > nuovo) t.classList.remove("via"); });
      atti.forEach(a => a.classList.toggle("on", +a.dataset.i === nuovo));
      atto = nuovo; palco.dataset.atto = nuovo;
    }
    bolle.forEach(b => b.classList.toggle("on", p >= +b.dataset.soglia && p < .52));
    const rr = Math.max(0, Math.min(1, (p - .5) / .2));
    foto.style.setProperty("--r", (rr * 85) + "%");
    alone.style.setProperty("--glow", atto === 2 ? 1 : atto === 3 ? .35 : .75);
    agenda.classList.toggle("atterrato", p > .6);
    document.body.classList.toggle("hx-sopra", r.bottom > 90 && p < .92);
  }
  let raf = 0;
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; progresso(); }); }, { passive: true });
  addEventListener("resize", progresso);
  progresso();
  if (calma) { palco.dataset.atto = 3; titoli.forEach(t => t.classList.toggle("on", t.dataset.attoT === "3")); agenda.classList.add("atterrato"); foto.style.setProperty("--r", "85%"); }

  // ===== onda sonora: righe di punti in prospettiva, arancioni, che reagiscono al mouse e all'atto =====
  const cv = document.getElementById("hx-onda");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, mx = .5, my = .6, mxT = .5, myT = .6, amp = .4, ampT = .4, vis = true, t0 = performance.now();
  const RIGHE = 34;
  function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size);
  addEventListener("pointermove", e => { mxT = e.clientX / innerWidth; myT = e.clientY / innerHeight; }, { passive: true });
  new IntersectionObserver(es => vis = es[0].isIntersecting).observe(show);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis || calma) return;
    const t = (now - t0) / 1000;
    mx += (mxT - mx) * .06; my += (myT - my) * .06;
    // atto 1: squilli a impulsi; atto 2: voce piena; atto 3: si calma e diventa una riga
    const squillo = Math.max(0, Math.sin(t * 5.2)) ** 6 * (Math.sin(t * 1.3) > 0 ? 1 : .15);
    ampT = atto === 1 ? .18 + squillo * .9 : atto === 2 ? 1 : .06;
    amp += (ampT - amp) * .07;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, orizzonte = H * .5, fondo = H * 1.02;
    const passi = Math.max(60, Math.floor(W / 14));
    for (let i = 0; i < RIGHE; i++) {
      const z = i / (RIGHE - 1);              // 0 lontano, 1 vicino
      const y0 = orizzonte + (fondo - orizzonte) * (z * z);
      const scala = .35 + z * 1.1;
      const largh = W * (.5 + z * .9);
      const alfa = (.08 + z * .55) * (atto === 3 ? .55 : 1);
      ctx.beginPath();
      for (let k = 0; k <= passi; k++) {
        const u = k / passi - .5;
        const x = cx + u * largh;
        const env = Math.exp(-((u * 2.4) ** 2));
        const dm = Math.exp(-(((x / W - mx) * 5) ** 2) - (((y0 / H - my) * 6) ** 2));
        const onda = Math.sin(u * 14 + t * 3.1 + i * .45) * .55 + Math.sin(u * 31 - t * 4.7 + i * .2) * .3 + Math.sin(u * 6 + t * 1.7) * .4;
        const y = y0 - (onda * env * amp * 46 + dm * 70 * (.4 + amp)) * scala;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const g = ctx.createLinearGradient(cx - largh / 2, 0, cx + largh / 2, 0);
      g.addColorStop(0, "rgba(255,106,26,0)"); g.addColorStop(.5, `rgba(255,${130 + Math.round(z * 60)},${60 + Math.round(z * 50)},${alfa})`); g.addColorStop(1, "rgba(255,106,26,0)");
      ctx.strokeStyle = g; ctx.lineWidth = .6 + z * 1.4; ctx.stroke();
    }
  }
  requestAnimationFrame(frame);
})();
