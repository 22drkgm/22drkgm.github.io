/* Kumar Gaurav Mishra, version v3 "Mono".
   Vanilla JS: theme toggle, metrics strip, and the PhD journey road.
   Journey data comes from ../shared/journey.js (window.JOURNEY). */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var root = document.documentElement;
  var desktopMQ = window.matchMedia('(min-width: 900px)');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');

  var MOBILE_ROAD_X = 16;   // x of the vertical road on small screens
  var MOBILE_GUTTER = 48;   // left indent of milestone cards on small screens

  /* ---------- helpers */

  function chem(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/PM(2\.5|10)/g, 'PM<sub>$1</sub>');
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.innerHTML = chem(text);
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  // Smooth S-curve from a to b with vertical tangents at both ends.
  function cubic(a, b) {
    var dy = b.y - a.y;
    return ' C ' + a.x + ' ' + (a.y + dy / 2) + ', ' + b.x + ' ' + (b.y - dy / 2) + ', ' + b.x + ' ' + b.y;
  }

  // Arc length on a monotonic-in-y path at which the path reaches height y.
  function lengthAtY(path, y, total) {
    var lo = 0;
    var hi = total;
    for (var i = 0; i < 32; i++) {
      var mid = (lo + hi) / 2;
      if (path.getPointAtLength(mid).y < y) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /* ---------- theme toggle (remembered in localStorage when available) */

  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return darkMQ.matches ? 'dark' : 'light';
  }

  function paintToggle() {
    if (!toggle) return;
    var dark = currentTheme() === 'dark';
    toggle.textContent = dark ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {
        /* storage unavailable: theme still applies for this page view */
      }
      paintToggle();
    });
  }

  if (darkMQ.addEventListener) darkMQ.addEventListener('change', paintToggle);
  paintToggle();

  /* ---------- journey data: metrics strip and milestones */

  var journey = window.JOURNEY || {};

  var metricsEl = document.getElementById('metrics');
  (journey.metrics || []).forEach(function (m) {
    var cell = el('div', 'metric');
    cell.appendChild(el('span', 'metric-num', m.value));
    cell.appendChild(el('span', 'metric-label', m.label));
    if (m.note) cell.appendChild(el('span', 'metric-note', m.note));
    metricsEl.appendChild(cell);
  });

  var road = document.getElementById('road');
  var svg = road.querySelector('.road-svg');
  var itemsEl = document.getElementById('road-items');
  var endEl = document.getElementById('road-end');
  var milestones = [];

  (journey.semesters || []).forEach(function (sem) {
    var items = sem.items || [];
    if (!items.length) return;

    var sign = el('li', 'sign', sem.label);
    itemsEl.appendChild(sign);

    items.forEach(function (item, i) {
      var li = el('li', 'ms type-' + item.type + (item.highlight ? ' is-highlight' : ''));

      var meta = el('div', 'ms-meta');
      meta.appendChild(el('time', null, item.date));
      meta.appendChild(el('span', 'ms-tag', item.type));
      li.appendChild(meta);

      li.appendChild(el('h3', 'ms-title', item.title));
      if (item.authors) li.appendChild(el('p', 'ms-authors', item.authors));
      if (item.detail) li.appendChild(el('p', 'ms-detail', item.detail));
      if (item.doi) {
        var link = el('a', 'ms-doi', 'doi:' + item.doi);
        link.href = 'https://doi.org/' + item.doi;
        li.appendChild(link);
      }

      itemsEl.appendChild(li);
      milestones.push({
        li: li,
        sign: i === 0 ? sign : null,
        type: item.type,
        x: 0,
        y: 0,
        h: 0,
        cardRight: true
      });
    });
  });

  /* ---------- layout and animation state */

  var state = null;
  var io = null;

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-on');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }

  function revealables() {
    var nodes = [];
    milestones.forEach(function (m) {
      if (m.sign) nodes.push(m.sign);
      nodes.push(m.li);
    });
    nodes.push(endEl);
    return nodes;
  }

  function relTop(node, base) {
    return node.getBoundingClientRect().top - base;
  }

  function layout() {
    if (!milestones.length) return;

    var desktop = desktopMQ.matches;
    var reduce = reduceMQ.matches;
    var W = road.clientWidth;

    // Reset everything the previous layout set.
    road.classList.remove('is-enhanced');
    road.classList.toggle('is-desktop', desktop);
    road.style.height = '';
    revealables().forEach(function (node) {
      node.classList.remove('is-on');
      node.style.top = '';
      node.style.left = '';
      node.style.removeProperty('--dx');
    });
    if (io) io.disconnect();
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var roadTop = road.getBoundingClientRect().top;
    var endX, endY, endRight, H, mainD, openD, ticks = [];

    if (desktop) {
      // Winding road: bends alternate between 25% and 75% of the width.
      // Cards sit on the opposite side from each bend.
      var y = 110;
      var prevH = 0;
      milestones.forEach(function (m, k) {
        var h = m.li.offsetHeight;
        if (k > 0) {
          y += Math.max(200, (prevH + h) / 2 + 64) + (m.sign ? 40 : 0);
        }
        var bendLeft = k % 2 === 0;
        m.x = (bendLeft ? 0.25 : 0.75) * W;
        m.y = y;
        m.h = h;
        m.cardRight = bendLeft;

        m.li.style.top = (y - h / 2) + 'px';
        m.li.style.left = bendLeft ? '55%' : '5%';
        m.li.style.setProperty('--dx', (bendLeft ? -14 : 14) + 'px');
        if (m.sign) {
          m.sign.style.left = m.x + 'px';
          m.sign.style.top = (y - 46) + 'px';
        }
        prevH = h;
      });

      var last = milestones[milestones.length - 1];
      endRight = milestones.length % 2 === 0;
      endX = (endRight ? 0.25 : 0.75) * W;
      endY = last.y + Math.max(200, last.h / 2 + 120);
      endEl.style.top = (endY - 18) + 'px';
      endEl.style.left = endRight ? '55%' : '5%';
      endEl.style.setProperty('--dx', (endRight ? -14 : 14) + 'px');

      H = endY + 170;
      road.style.height = H + 'px';

      var points = milestones.map(function (m) {
        return { x: m.x, y: m.y };
      });
      points.push({ x: endX, y: endY });

      var start = { x: W / 2, y: 0 };
      mainD = 'M ' + start.x + ' ' + start.y;
      var prev = start;
      points.forEach(function (p) {
        mainD += cubic(prev, p);
        prev = p;
      });
      openD = 'M ' + endX + ' ' + endY + ' L ' + endX + ' ' + (endY + 150);

      milestones.forEach(function (m) {
        ticks.push({ x1: m.x, x2: m.cardRight ? 0.55 * W - 6 : 0.45 * W + 6, y: m.y });
      });
      ticks.push({ x1: endX, x2: endRight ? 0.55 * W - 6 : 0.45 * W + 6, y: endY });
    } else {
      // Straight road on the left, cards to the right.
      milestones.forEach(function (m) {
        m.x = MOBILE_ROAD_X;
        m.y = relTop(m.li, roadTop) + 16;
        m.cardRight = true;
        ticks.push({ x1: m.x, x2: MOBILE_GUTTER - 6, y: m.y });
      });
      endX = MOBILE_ROAD_X;
      endY = relTop(endEl, roadTop) + 16;
      ticks.push({ x1: endX, x2: MOBILE_GUTTER - 6, y: endY });

      H = road.offsetHeight;
      mainD = 'M ' + MOBILE_ROAD_X + ' 0 L ' + MOBILE_ROAD_X + ' ' + endY;
      openD = 'M ' + MOBILE_ROAD_X + ' ' + endY + ' L ' + MOBILE_ROAD_X + ' ' + H;
    }

    // Draw SVG at 1:1 scale: viewBox equals the rendered size.
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.height = H + 'px';

    ticks.forEach(function (t) {
      svg.appendChild(svgEl('line', {
        x1: t.x1, y1: t.y, x2: t.x2, y2: t.y, 'class': 'road-tick'
      }));
    });
    svg.appendChild(svgEl('path', { d: mainD, 'class': 'road-band' }));
    svg.appendChild(svgEl('path', { d: openD, 'class': 'road-band road-band--open' }));
    svg.appendChild(svgEl('path', { d: mainD, 'class': 'road-centre' }));
    svg.appendChild(svgEl('path', { d: openD, 'class': 'road-centre road-centre--open' }));

    var progress = svgEl('path', { d: mainD, 'class': 'road-progress' });
    svg.appendChild(progress);

    milestones.forEach(function (m) {
      var marker = svgEl('circle', { cx: m.x, cy: m.y, r: 6, 'class': 'road-marker' });
      marker.style.stroke = 'var(--c-' + m.type + ', var(--muted))';
      svg.appendChild(marker);
    });

    var endMarker = svgEl('circle', { cx: endX, cy: endY, r: 5, 'class': 'road-marker' });
    endMarker.style.stroke = 'var(--muted)';
    svg.appendChild(endMarker);

    var dot = svgEl('circle', { cx: 0, cy: 0, r: 7, 'class': 'road-dot' });
    svg.appendChild(dot);

    var total = progress.getTotalLength();
    progress.style.strokeDasharray = total + ' ' + total;

    var stops = [];
    if (desktop) {
      milestones.forEach(function (m) {
        stops.push({
          s: lengthAtY(progress, m.y, total),
          nodes: m.sign ? [m.sign, m.li] : [m.li]
        });
      });
      stops.push({ s: lengthAtY(progress, endY, total), nodes: [endEl] });
    }

    state = {
      desktop: desktop,
      reduce: reduce,
      total: total,
      progress: progress,
      dot: dot,
      stops: stops
    };

    if (!reduce) {
      road.classList.add('is-enhanced');
      if (!desktop) {
        if (io) {
          revealables().forEach(function (node) { io.observe(node); });
        } else {
          revealables().forEach(function (node) { node.classList.add('is-on'); });
        }
      }
    }

    update();
  }

  // Scroll-linked progress: the road builds as the section passes the viewport.
  function update() {
    if (!state || state.total <= 0) return;

    var p = 1;
    if (!state.reduce) {
      var rect = road.getBoundingClientRect();
      var vh = window.innerHeight || root.clientHeight;
      p = clamp((vh * 0.7 - rect.top) / Math.max(rect.height, 1), 0, 1);
    }

    var len = p * state.total;
    state.progress.style.strokeDashoffset = String(state.total * (1 - p));

    var pt = state.progress.getPointAtLength(Math.max(len, 0.01));
    state.dot.setAttribute('cx', pt.x);
    state.dot.setAttribute('cy', pt.y);
    state.dot.style.opacity = p > 0 ? '1' : '0';

    if (state.desktop && !state.reduce) {
      state.stops.forEach(function (stop) {
        var on = len >= stop.s - 40;
        stop.nodes.forEach(function (node) {
          node.classList.toggle('is-on', on);
        });
      });
    }
  }

  /* ---------- events */

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }, { passive: true });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 120);
  });

  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  layout();
})();
