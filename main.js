/* Swiss Grid — v2
   - Renders window.JOURNEY (shared/journey.js) as a road.
   - Desktop (>=1024px, motion allowed): horizontal road driven by vertical scroll
     inside a tall section with a sticky, overflow-hidden stage.
   - Otherwise: vertical road on the left, cards on the right, revealed via IntersectionObserver.
   - Side navigation: mobile menu toggle, scroll-spy with IntersectionObserver.
   - Performance: layout is measured in one batch (cached until invalidated), scroll
     and resize work is coalesced into one animation frame, and paint only writes. */
(function () {
  'use strict';

  var J = window.JOURNEY || {};
  var SEMESTERS = J.semesters || [];
  var METRICS = J.metrics || [];
  var TYPE_LABEL = {
    workshop: 'Workshop',
    conference: 'Conference',
    publication: 'Publication',
    international: 'International'
  };

  // Horizontal layout constants (px)
  var START_PAD = 160;   // lead-in before first semester sign
  var SIGN_STEP = 200;   // sign -> first milestone
  var ITEM_STEP = 260;   // milestone -> milestone (cards alternate sides)
  var END_PAD = 260;     // room after the open-ended last card
  var REVEAL_AT = 0.9;   // reveal a milestone when it reaches 90% of the stage width
  var RESIZE_DEBOUNCE = 120;

  var root = document.getElementById('journey');
  var stage = document.getElementById('j-stage');
  var track = document.getElementById('j-track');
  var progH = track.querySelector('.j-prog-h');
  var progLine = progH.querySelector('line');
  var progFront = progH.querySelector('.j-front');
  var progV = track.querySelector('.j-prog-v');
  var counter = document.getElementById('j-count');
  var metricsList = document.getElementById('metrics');

  var mqDesk = window.matchMedia('(min-width: 1024px)');
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var seq = [];          // every node in road order: signs and items
  var items = [];        // milestone items plus the open-ended end card
  var milestones = 0;    // count of real milestones (end card excluded)
  var revealed = 0;      // milestones shown so far (end card excluded)
  var countText = '';    // last text written to the counter (skip redundant writes)
  var trackW = 0;
  var mode = null;       // 'h' or 'v'
  var reduced = false;   // cached prefers-reduced-motion state
  var io = null;
  var frame = 0;         // pending animation frame id, 0 when idle
  var needMeasure = true;
  var resizeTimer = 0;

  // Geometry cache. Filled by measure(); the scroll path reads only this and scrollY.
  var geo = { secTop: 0, rangeH: 0, stageW: 0, trackTop: 0, trackOffH: 0, trackRectH: 0 };

  /* ---------- helpers ---------- */

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function scrollOffset() { return window.pageYOffset || document.documentElement.scrollTop || 0; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Escape, then set chemical subscripts (PM2.5, PM10, SO2, NO2).
  function fmt(s) {
    return esc(s || '')
      .replace(/PM(2\.5|10)/g, 'PM<sub>$1</sub>')
      .replace(/SO2/g, 'SO<sub>2</sub>')
      .replace(/NO2/g, 'NO<sub>2</sub>');
  }

  function setRich(node, s) { node.innerHTML = fmt(s); }

  function onMQ(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else mq.addListener(fn);
  }

  /* ---------- build ---------- */

  function makeItem(it, up) {
    var type = it.type || '';
    var item = el('div', 'j-item ' + (up ? 'j-up' : 'j-down') +
      (type ? ' t-' + type : '') + (it.highlight ? ' is-hl' : ''));
    var card = el('article', 'j-card' + (it.highlight ? ' is-hl' : ''));

    var top = el('div', 'j-top');
    top.appendChild(el('time', 'j-date', it.date || ''));
    top.appendChild(el('span', 'j-tag', TYPE_LABEL[type] || type || 'Milestone'));
    card.appendChild(top);

    var title = el('h3', 'j-title');
    setRich(title, it.title);
    card.appendChild(title);

    if (it.detail) {
      var d = el('p', 'j-detail');
      setRich(d, it.detail);
      card.appendChild(d);
    }
    if (it.authors) {
      var a = el('p', 'j-auth');
      setRich(a, it.authors);
      card.appendChild(a);
    }
    if (it.doi) {
      var p = el('p', 'j-doi');
      var link = el('a', null, 'doi:' + it.doi);
      link.href = 'https://doi.org/' + it.doi;
      link.rel = 'noopener';
      p.appendChild(link);
      card.appendChild(p);
    }

    item.appendChild(el('span', 'j-tick'));
    item.appendChild(el('span', 'j-dot'));
    item.appendChild(card);
    return { el: item, kind: 'item', x: 0, end: false, shown: false };
  }

  function makeEnd(up) {
    var item = el('div', 'j-item j-end ' + (up ? 'j-up' : 'j-down'));
    var card = el('article', 'j-card');

    var top = el('div', 'j-top');
    top.appendChild(el('time', 'j-date', 'Dec 2026'));
    top.appendChild(el('span', 'j-tag', 'Next'));
    card.appendChild(top);

    card.appendChild(el('h3', 'j-title', 'Thesis submission'));
    card.appendChild(el('p', 'j-detail', 'Defence before March 2027. More to come.'));

    item.appendChild(el('span', 'j-tick'));
    item.appendChild(el('span', 'j-dot'));
    item.appendChild(card);
    return { el: item, kind: 'item', x: 0, end: true, shown: false };
  }

  function build() {
    var frag = document.createDocumentFragment();
    var n = 0;

    SEMESTERS.forEach(function (sem) {
      var sign = el('div', 'j-sign', sem.label || '');
      frag.appendChild(sign);
      seq.push({ el: sign, kind: 'sign', x: 0, end: false });

      (sem.items || []).forEach(function (it) {
        var o = makeItem(it, n % 2 === 0);
        n += 1;
        milestones += 1;
        frag.appendChild(o.el);
        seq.push(o);
        items.push(o);
      });
    });

    var endO = makeEnd(n % 2 === 0);
    frag.appendChild(endO.el);
    seq.push(endO);
    items.push(endO);

    track.appendChild(frag);
  }

  function renderMetrics() {
    var frag = document.createDocumentFragment();
    METRICS.forEach(function (m) {
      var li = el('li', 'metric');
      li.appendChild(el('span', 'num', String(m.value)));
      li.appendChild(el('span', 'm-label', m.label || ''));
      if (m.note) li.appendChild(el('span', 'm-note', m.note));
      frag.appendChild(li);
    });
    metricsList.appendChild(frag);
  }

  /* ---------- reveal state and counter (no layout reads) ---------- */

  function reveal(o) {
    if (o.shown) return;
    o.shown = true;
    o.el.classList.add('is-in');
    if (!o.end) revealed += 1;
  }

  function revealAll() {
    items.forEach(reveal);
    updateCount();
  }

  function updateCount() {
    var text = pad(revealed) + ' / ' + pad(milestones);
    if (text !== countText) {
      countText = text;
      counter.textContent = text;
    }
  }

  function itemFor(node) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].el === node) return items[i];
    }
    return null;
  }

  /* ---------- layout (writes only; called once per mode change) ---------- */

  function layoutH() {
    var x = START_PAD;
    seq.forEach(function (s) {
      if (s.kind === 'sign') {
        s.el.style.left = x + 'px';
        x += SIGN_STEP;
      } else {
        s.x = x;
        s.el.style.left = x + 'px';
        x += ITEM_STEP;
      }
    });
    trackW = x + END_PAD;
    track.style.width = trackW + 'px';
    progH.setAttribute('width', trackW);
  }

  function clearH() {
    seq.forEach(function (s) { s.el.style.left = ''; });
    track.style.width = '';
    track.style.transform = '';
    progH.removeAttribute('width');
    progLine.setAttribute('x2', '0');
    progFront.setAttribute('cx', '0');
    root.style.height = '';
  }

  /* ---------- measure (reads only; one batch, cached) ---------- */

  function measure() {
    var scrollY = scrollOffset();
    var rootRect = root.getBoundingClientRect();
    var trackRect = track.getBoundingClientRect();
    geo.secTop = rootRect.top + scrollY;
    geo.rangeH = root.offsetHeight - stage.offsetHeight;
    geo.stageW = stage.clientWidth;
    geo.trackTop = trackRect.top + scrollY;
    geo.trackRectH = trackRect.height;
    geo.trackOffH = track.offsetHeight;
    needMeasure = false;
  }

  /* ---------- paint (reads only the cached geometry and scrollY; writes) ---------- */

  function paintH(scrollY) {
    var p = geo.rangeH > 0 ? clamp((scrollY - geo.secTop) / geo.rangeH, 0, 1) : 0;
    var tx = -p * Math.max(0, trackW - geo.stageW);
    track.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,0,0)';

    // Progress line grows left to right along the road; its front travels with the track.
    var fx = (p * trackW).toFixed(1);
    progLine.setAttribute('x2', fx);
    progFront.setAttribute('cx', fx);

    var edge = geo.stageW * REVEAL_AT;
    items.forEach(function (o) {
      if (!o.shown && o.x + tx < edge) reveal(o);
    });
    updateCount();
  }

  function paintV(scrollY) {
    var h = geo.trackOffH;
    if (reduced) {
      progV.style.height = h + 'px';
      return;
    }
    var top = geo.trackTop - scrollY;
    var p = geo.trackRectH > 0 ? clamp((window.innerHeight * 0.6 - top) / geo.trackRectH, 0, 1) : 0;
    progV.style.height = (p * h).toFixed(1) + 'px';
  }

  // Coalesces every scroll, resize and layout signal into one frame.
  // Measure (reads) runs first if the cache is stale, then paint (writes).
  function requestUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      if (needMeasure) measure();
      var scrollY = scrollOffset();
      if (mode === 'h') paintH(scrollY);
      else if (mode === 'v') paintV(scrollY);
    });
  }

  function invalidate() {
    needMeasure = true;
    requestUpdate();
  }

  /* ---------- vertical mode reveal ---------- */

  function setupIO() {
    if (io) { io.disconnect(); io = null; }
    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var o = itemFor(e.target);
        if (o) reveal(o);
        obs.unobserve(e.target);
      });
      updateCount();
    }, { rootMargin: '0px 0px -8% 0px' });
    io = obs;
    items.forEach(function (o) {
      if (!o.shown) obs.observe(o.el);
    });
  }

  /* ---------- mode switch ---------- */

  function applyMode() {
    reduced = mqMotion.matches;
    var useH = mqDesk.matches && !reduced;

    if (useH) {
      if (io) { io.disconnect(); io = null; }
      root.classList.add('j-h');
      root.classList.remove('j-v');
      mode = 'h';
      layoutH();
      root.style.height = Math.max(window.innerHeight, milestones * 0.45 * window.innerHeight) + 'px';
    } else {
      root.classList.remove('j-h');
      root.classList.add('j-v');
      mode = 'v';
      clearH();
      if (reduced) {
        if (io) { io.disconnect(); io = null; }
        revealAll();
      } else {
        setupIO();
      }
    }
    invalidate();
  }

  /* ---------- side navigation ---------- */

  function initNav() {
    var side = document.getElementById('side');
    var btn = side.querySelector('.menu-btn');
    var links = {};
    var activeId = null;

    function setOpen(open) {
      side.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
    }

    btn.addEventListener('click', function () {
      setOpen(!side.classList.contains('is-open'));
    });

    side.querySelectorAll('.nav a').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
      a.addEventListener('click', function () {
        if (!mqDesk.matches) setOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && side.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });

    onMQ(mqDesk, function () { setOpen(false); });

    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      Object.keys(links).forEach(function (k) {
        var on = k === id;
        links[k].classList.toggle('is-active', on);
        if (on) links[k].setAttribute('aria-current', 'true');
        else links[k].removeAttribute('aria-current');
      });
    }

    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(links).forEach(function (id) {
        var s = document.getElementById(id);
        if (s) spy.observe(s);
      });
    }
  }

  /* ---------- init ---------- */

  build();
  renderMetrics();
  initNav();
  applyMode();

  // Scroll: passive and coalesced by requestUpdate (no reads in the handler).
  window.addEventListener('scroll', requestUpdate, { passive: true });

  // Resize: debounced. The mode check and relayout run once the resize settles.
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyMode, RESIZE_DEBOUNCE);
  }, { passive: true });

  // Re-measure when anything above or around the road changes size or fonts land.
  window.addEventListener('load', invalidate);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(invalidate);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(invalidate);
    ro.observe(root);
    ro.observe(document.body);
  }

  onMQ(mqDesk, applyMode);
  onMQ(mqMotion, applyMode);
})();
