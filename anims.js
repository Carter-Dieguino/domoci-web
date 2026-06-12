/* DOMO — coreografía fina compartida (progreso, topbar, split H1, imán) */
(function () {
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hairline de progreso de scroll + topbar condensada
  var prog = document.createElement('div');
  prog.className = 'scroll-progress';
  prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);

  var head = document.querySelector('.head');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      if (head) head.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (RM) return; // lo que sigue es decorativo

  // H1 del hero — split palabra por palabra
  var h1 = document.querySelector('.hero .h1');
  if (h1) {
    h1.classList.remove('reveal', 'reveal--2');
    var idx = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi';
            wi.textContent = part;
            wi.style.setProperty('--d', (0.12 + idx * 0.09).toFixed(2) + 's');
            idx++;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          split(child);
        }
      });
    })(h1);
  }

  if (!window.matchMedia('(pointer: fine)').matches) return;
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Botones primarios — imán sutil
  document.querySelectorAll('.btn--primary, .btn--accent, .btn--white').forEach(function (btn) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function tick() {
      cx = lerp(cx, tx, .18); cy = lerp(cy, ty, .18);
      btn.style.setProperty('--bx', cx.toFixed(2) + 'px');
      btn.style.setProperty('--by', cy.toFixed(2) + 'px');
      if (Math.abs(cx - tx) > .1 || Math.abs(cy - ty) > .1) raf = requestAnimationFrame(tick);
      else { raf = null; if (!tx && !ty) btn.classList.remove('is-magnet'); }
    }
    btn.addEventListener('pointermove', function (ev) {
      var r = btn.getBoundingClientRect();
      tx = (ev.clientX - r.left - r.width / 2) * .14;
      ty = (ev.clientY - r.top - r.height / 2) * .26;
      btn.classList.add('is-magnet');
      if (!raf) raf = requestAnimationFrame(tick);
    });
    btn.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  });

  // Tilt 3D del visual del hero
  var vis = document.querySelector('.hero__visual');
  if (vis) {
    var rx = 0, ry = 0, crx = 0, cry = 0, raf2 = null;
    function tick2() {
      crx = lerp(crx, rx, .12); cry = lerp(cry, ry, .12);
      vis.style.transform = 'perspective(900px) rotateX(' + crx.toFixed(2) + 'deg) rotateY(' + cry.toFixed(2) + 'deg)';
      if (Math.abs(crx - rx) > .02 || Math.abs(cry - ry) > .02) raf2 = requestAnimationFrame(tick2);
      else raf2 = null;
    }
    vis.addEventListener('pointermove', function (ev) {
      var r = vis.getBoundingClientRect();
      ry = ((ev.clientX - r.left) / r.width - .5) * 6;
      rx = -((ev.clientY - r.top) / r.height - .5) * 6;
      if (!raf2) raf2 = requestAnimationFrame(tick2);
    });
    vis.addEventListener('pointerleave', function () {
      rx = 0; ry = 0;
      if (!raf2) raf2 = requestAnimationFrame(tick2);
    });
  }
})();
