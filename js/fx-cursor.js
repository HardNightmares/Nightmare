'use strict';

(function (ns) {
  const INTERACTIVE_SELECTOR =
    'a, button, input, [role="button"], .magnetic, .social-link, .track-control';

  function initCursorAndMagnetics() {
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReduced) return;

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const smokeLayer = document.getElementById('smokeLayer');
    if (!dot || !ring) return;

    document.body.classList.add('has-custom-cursor');

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let lastSmokeTime = 0;
    let lastSmokeX = 0;
    let lastSmokeY = 0;

    const spawnSmoke = (x, y) => {
      if (!smokeLayer || smokeLayer.childElementCount > 18) return;
      const puff = document.createElement('span');
      puff.className = 'smoke-puff';
      puff.style.left = `${x}px`;
      puff.style.top = `${y}px`;
      puff.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 28)}px`);
      smokeLayer.appendChild(puff);
      puff.addEventListener('animationend', () => puff.remove(), { once: true });
    };

    window.addEventListener(
      'pointermove',
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        dot.style.opacity = '1';
        ring.style.opacity = '1';

        const hovered = e.target && e.target.closest ? e.target.closest(INTERACTIVE_SELECTOR) : null;
        ring.classList.toggle('is-hover', Boolean(hovered));

        const now = performance.now();
        const dist = Math.hypot(targetX - lastSmokeX, targetY - lastSmokeY);
        if (now - lastSmokeTime > 75 && dist > 18) {
          lastSmokeTime = now;
          lastSmokeX = targetX;
          lastSmokeY = targetY;
          spawnSmoke(targetX, targetY);
        }
      },
      { passive: true }
    );

    window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    window.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    const animateCursor = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX.toFixed(2)}px, ${ringY.toFixed(2)}px, 0)`;
      requestAnimationFrame(animateCursor);
    };
    requestAnimationFrame(animateCursor);

    const bindMagnetics = () => {
      document.querySelectorAll('.magnetic').forEach((node) => {
        if (node.dataset.magneticBound === '1' || node.id === 'entryScreen') return;
        node.dataset.magneticBound = '1';

        node.addEventListener('pointermove', (e) => {
          const rect = node.getBoundingClientRect();
          const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
          const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
          node.style.transform = `translate3d(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px, 0)`;
        });

        node.addEventListener('pointerleave', () => {
          node.style.transform = '';
        });
      });
    };

    bindMagnetics();
    window.setTimeout(bindMagnetics, 150);
  }

  ns.initCursorAndMagnetics = initCursorAndMagnetics;
})(window.NightmareSite = window.NightmareSite || {});
