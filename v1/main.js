/* Editorial v1 — renders window.JOURNEY, drives the road and the mobile menu. */
(function () {
  'use strict';

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var data = window.JOURNEY || { metrics: [], semesters: [] };
  var TYPE_NAMES = {
    workshop: 'Workshop',
    conference: 'Conference',
    publication: 'Publication',
    international: 'International'
  };

  function chem(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/PM(2\.5|10)/g, 'PM<sub>$1</sub>');
  }

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.innerHTML = chem(text);
    return node;
  }

  /* ---------- Metrics strip ---------- */

  function renderMetrics() {
    var root = document.getElementById('metrics');
    if (!root || !data.metrics) return;
    data.metrics.forEach(function (m) {
      var cell = make('div', 'metric');
      cell.appendChild(make('div', 'm-val', m.value));
      cell.appendChild(make('div', 'm-label', m.label));
      if (m.note) cell.appendChild(make('div', 'm-note', m.note));
      root.appendChild(cell);
    });
  }

  /* ---------- Journey timeline ---------- */

  function buildItem(it) {
    var type = TYPE_NAMES[it.type] ? it.type : 'workshop';
    var li = make('li', 'ms t-' + type + (it.highlight ? ' hl' : ''));
    li.appendChild(make('span', 'node'));
    li.appendChild(make('span', 'tick'));
    li.firstChild.setAttribute('aria-hidden', 'true');
    li.lastChild.setAttribute('aria-hidden', 'true');

    var card = make('article', 'card');

    var date = make('p', 'ms-date', it.date);
    date.appendChild(make('span', 'tag', TYPE_NAMES[type]));
    card.appendChild(date);

    card.appendChild(make('h3', 'ms-title', it.title));
    if (it.detail) card.appendChild(make('p', 'ms-detail', it.detail));
    if (it.authors) card.appendChild(make('p', 'ms-authors', it.authors));
    if (it.doi) {
      var doiP = make('p', 'doi');
      var a = make('a', null, 'doi:' + it.doi);
      a.href = 'https://doi.org/' + it.doi;
      a.rel = 'noopener';
      doiP.appendChild(a);
      card.appendChild(doiP);
    }

    li.appendChild(card);
    return li;
  }

  function renderJourney() {
    var root = document.getElementById('journey-list');
    if (!root || !data.semesters) return;
    data.semesters.forEach(function (sem) {
      var block = make('div', 'sem');
      var head = make('div', 'sem-head');
      head.appendChild(make('span', 'sign', sem.label));
      block.appendChild(head);

      var list = make('ol', 'ms-list');
      (sem.items || []).forEach(function (it) {
        list.appendChild(buildItem(it));
      });
      block.appendChild(list);
      root.appendChild(block);
    });
  }

  /* Road drawing: progress follows how far the timeline has scrolled past
     a point 60% down the viewport. */
  var track = null;
  var roadPath = null;
  var tip = null;
  var queued = false;

  function updateRoad() {
    queued = false;
    if (!track || !roadPath) return;
    var rect = track.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var height = rect.height;
    var p = height > 0 ? (vh * 0.6 - rect.top) / height : 1;
    if (p < 0) p = 0;
    if (p > 1) p = 1;

    roadPath.style.strokeDashoffset = String(1 - p);
    if (tip) {
      tip.style.transform = 'translateY(' + (p * height).toFixed(1) + 'px)';
      tip.style.opacity = p > 0 ? '1' : '0';
    }
  }

  function queueRoad() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(updateRoad);
  }

  function revealItems() {
    if (reduceMotion || !track) return;
    if (!('IntersectionObserver' in window)) return;

    track.classList.add('js-anim');
    var items = track.querySelectorAll('.ms');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(items, function (li) { io.observe(li); });
  }

  function setupRoad() {
    track = document.getElementById('jtrack');
    if (!track) return;
    roadPath = track.querySelector('.road-draw');
    tip = track.querySelector('.tip');

    revealItems();

    if (reduceMotion) {
      // Static: the path keeps its default fully-drawn state from CSS.
      return;
    }

    updateRoad();
    window.addEventListener('scroll', queueRoad, { passive: true });
    window.addEventListener('resize', queueRoad);
  }

  /* ---------- Mobile menu ---------- */

  function setupMenu() {
    var btn = document.getElementById('menu-btn');
    var panel = document.getElementById('mnav');
    if (!btn || !panel) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
      panel.hidden = !open;
    }

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', function (e) {
      if (e.target && e.target.tagName === 'A') setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  /* ---------- Init ---------- */

  function init() {
    renderMetrics();
    renderJourney();
    setupRoad();
    setupMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
