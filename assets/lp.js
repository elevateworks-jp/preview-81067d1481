(() => {
  const root = document.documentElement;
  const motion = root.classList.contains("motion");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  
  const events = (window.__lpEvents = []);
  const track = (name, params = {}) => {
    const e = { event: name, ...params, t: Math.round(performance.now()) };
    events.push(e);
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(e);
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) track(t.dataset.track, { location: t.dataset.loc || null, product_id: t.dataset.pid || null });
  });

  
  const PRODUCTS = window.R7_PRODUCTS || [], REVIEW = window.R7_PURCHASE_REVIEW || {}, MODE = window.R7_MODE;
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const canBuy = (p) => {
    if (MODE === "share") return false;
    const r = p && REVIEW[p.id];
    if (!r || !p.ecUrl || r.ecUrl !== p.ecUrl) return false;
    let u; try { u = new URL(r.ecUrl); } catch { return false; }
    if (u.protocol !== "https:" || u.hostname !== "www.ryo-yu.net") return false;
    if (r.nameMatch !== true || !r.linkCheckedAt || r.onSaleAtShop !== true) return false;
    return MODE === "demo" ? r.approvedForDemo === true : r.approvedForLaunch === true && r.makerNetSaleConfirmed === true && !!r.approvedBy;
  };
  $$(".cta-ec[data-pid]").forEach((a) => {
    const p = byId(a.dataset.pid);
    if (!canBuy(p) || a.href !== p.ecUrl) a.remove();
  });

  
  const bar = $(".callbar");
  if (bar && "IntersectionObserver" in window) {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
      bar.classList.toggle("is-hidden", seen.size > 0);
    });
    $$("#fv-call, .cta-final").forEach((el) => io.observe(el));
  }

  
  const qs = $$(".q");
  if (motion && "IntersectionObserver" in window) {
    const qio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); qio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    qs.forEach((q) => qio.observe(q));
  } else {
    qs.forEach((q) => q.classList.add("is-in"));
  }

  
  const sc = $("#showcase");
  const tray = $(".sc-tray", sc);
  const trackEl = $(".sc-track", sc);
  const slides = $$(".sc-slide", sc);
  const seats = $$(".sc-seat", sc);
  const posN = $(".sc-pos-n", sc);
  const [btnPrev, btnNext] = $$(".sc-btn", sc);
  const n = slides.length;
  $(".sc-pos-total", sc).textContent = String(n);
  const wide = window.matchMedia("(min-width: 1025px)");
  const pinned = () => motion && wide.matches;

  function placeSeats(turn) {
    if (!motion) return;
    const T = tray.clientWidth;
    const front = pinned() ? 180 : 90;
    seats.forEach((el, i) => {
      const off = i - turn;
      const th = ((front - off * 90) * Math.PI) / 180;
      const near = clamp(1 - Math.abs(off));
      const x = (.5 + 0.3 * Math.cos(th) - 0.130) * T;
      const y = (.5 + 0.3 * Math.sin(th) - 0.1733) * T;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(.72 + .38 * near).toFixed(3)})`;
      el.style.opacity = String(.55 + .45 * near);
      el.style.zIndex = String(1 + Math.round(near * 3));
    });
  }

  let current = -1;
  function setCurrent(i, from) {
    if (i === current) return;
    const prev = current;
    current = i;
    const pin = pinned();
    slides.forEach((s, k) => {
      s.classList.toggle("is-current", k === i);
      if (pin && k !== i) s.setAttribute("inert", ""); else s.removeAttribute("inert");
    });
    posN.textContent = String(i + 1);
    btnPrev.disabled = i === 0;
    btnNext.disabled = i === n - 1;
    if (prev !== -1) track("showcase_change", { product_id: slides[i].dataset.pid, location: from || null });
  }

  function onPinnedScroll() {
    const r = sc.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - window.innerHeight));
    const t = p * (n - 1);
    const k = Math.min(n - 2, Math.floor(t));
    const turn = k + ease(clamp((t - k - .2) / .6));
    placeSeats(turn);
    setCurrent(Math.round(turn), "scroll");
  }
  function onTrackScroll() {
    const box = trackEl.getBoundingClientRect(), mid = box.left + box.width / 2;
    let i = 0, best = Infinity;
    slides.forEach((s, k) => { const r = s.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < best) { best = d; i = k; } });
    setCurrent(i, "swipe");
    placeSeats(i);
  }

  function go(i, from) {
    i = Math.max(0, Math.min(n - 1, i));
    const behavior = motion ? "smooth" : "auto";
    if (pinned()) {
      const top = sc.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (i / (n - 1)) * (sc.offsetHeight - window.innerHeight), behavior });
    } else {
      trackEl.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior });
    }
    track("showcase_button", { product_id: slides[i].dataset.pid, location: from });
  }
  btnPrev.addEventListener("click", () => go(current - 1, "prev"));
  btnNext.addEventListener("click", () => go(current + 1, "next"));
  sc.addEventListener("keydown", (e) => {
    if (e.target.closest("a, button") && !e.target.closest(".sc-controls")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1, "key"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1, "key"); }
  });

  
  const noon = $(".ambient-noon");
  function onAmbient() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    noon.style.opacity = String(clamp(window.scrollY / Math.max(1, max)) * .9);
  }

  let queued = false;
  function frame() {
    queued = false;
    if (pinned()) onPinnedScroll();
    if (motion) onAmbient();
  }
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  trackEl.addEventListener("scroll", () => { if (!pinned()) requestAnimationFrame(onTrackScroll); }, { passive: true });
  const reset = () => {
    current = -1;
    if (pinned()) onPinnedScroll(); else { slides.forEach((s) => s.removeAttribute("inert")); onTrackScroll(); }
  };
  wide.addEventListener("change", reset);
  window.addEventListener("resize", onScroll);

  reset();
  if (motion) onAmbient();
  root.classList.add("ready");
})();
