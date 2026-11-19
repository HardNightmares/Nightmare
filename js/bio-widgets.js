'use strict';

(function (ns) {
  function initBioDrawer(onOpen) {
    const panel = document.querySelector('[data-bio-drawer]');
    const toggle = document.getElementById('bioToggle');
    const drawer = document.getElementById('bioDrawer');
    if (!panel || !toggle || !drawer) return;

    let closeTimer = 0;

    toggle.addEventListener('click', () => {
      const willOpen = !panel.classList.contains('is-open');
      window.clearTimeout(closeTimer);

      if (willOpen) {
        drawer.hidden = false;
        void drawer.offsetHeight;
        panel.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        if (typeof onOpen === 'function') onOpen();
      } else {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        closeTimer = window.setTimeout(() => {
          if (!panel.classList.contains('is-open')) {
            drawer.hidden = true;
          }
        }, 430);
      }
    });
  }

  function initMoscowClock(timezone) {
    const clockEl = document.getElementById('moscowTime');
    if (!clockEl) return;

    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: timezone || 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const render = () => {
      clockEl.textContent = formatter.format(new Date());
    };

    render();
    window.setInterval(render, 1000);
  }

  function initErrorWords(showToast) {
    const buttons = document.querySelectorAll('.error-words button[data-error-word]');
    const messages = {
      FILE: 'ERR_404: relationship.exe missing',
      NOT: 'STATUS: solo mode active',
      FOUND: 'SYSTEM: zero matches in memory',
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const word = btn.getAttribute('data-error-word') || '';
        btn.classList.remove('is-glitching');
        void btn.offsetWidth;
        btn.classList.add('is-glitching');
        if (messages[word] && typeof showToast === 'function') {
          showToast(messages[word]);
        }
      });
    });
  }

  function initFavoriteTabs() {
    const container = document.querySelector('[data-favorite-selector]');
    if (!container) return;

    const tabs = Array.from(container.querySelectorAll('[data-favorite-tab]'));
    const panels = Array.from(container.querySelectorAll('[data-favorite-panel]'));

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-favorite-tab');
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        panels.forEach((p) => {
          p.hidden = p.getAttribute('data-favorite-panel') !== target;
        });
      });
    });
  }

  function initCarousels(lists) {
    const mapping = [
      ['gamesCarousel', lists.games || []],
      ['moviesCarousel', lists.movies || []],
      ['likesCarousel', lists.likes || []],
    ];

    mapping.forEach(([id, items]) => {
      const root = document.getElementById(id);
      if (!root || !items.length) return;

      const prevBtn = root.querySelector('[data-carousel-step="-1"]');
      const activeBtn = root.querySelector('[data-carousel-step="0"]');
      const nextBtn = root.querySelector('[data-carousel-step="1"]');
      let index = 0;

      const render = () => {
        root.setAttribute('data-index', String(index));
        const total = items.length;
        if (activeBtn) activeBtn.textContent = items[index];

        if (total <= 1) {
          if (prevBtn) prevBtn.textContent = '';
          if (nextBtn) nextBtn.textContent = '';
        } else if (total === 2) {
          const other = items[(index + 1) % total];
          if (prevBtn) prevBtn.textContent = '';
          if (nextBtn) nextBtn.textContent = other;
        } else {
          if (prevBtn) prevBtn.textContent = items[(index - 1 + total) % total];
          if (nextBtn) nextBtn.textContent = items[(index + 1) % total];
        }
      };

      const step = (delta) => {
        if (items.length <= 1) return;
        index = (index + delta + items.length) % items.length;
        render();
      };

      if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => step(1));
      if (activeBtn) activeBtn.addEventListener('click', () => step(1));

      root.addEventListener(
        'wheel',
        (e) => {
          if (items.length <= 1) return;
          e.preventDefault();
          step(e.deltaY > 0 ? 1 : -1);
        },
        { passive: false }
      );

      render();
    });
  }

  function initDiscordPresence(discordConfig) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const activityText = document.getElementById('activityText');
    const activityMeta = document.getElementById('activityMeta');
    const activityElapsed = document.getElementById('activityElapsed');
    const activityProgressFill = document.getElementById('activityProgressFill');
    const activityRemaining = document.getElementById('activityRemaining');
    const activityVisual = document.getElementById('activityVisual');
    const activityIcon = document.getElementById('activityIcon');

    const applyFallback = () => {
      if (statusDot) statusDot.setAttribute('data-status', discordConfig.fallbackStatus || 'dnd');
      if (statusText) statusText.textContent = discordConfig.fallbackStatus || 'dnd';
      if (activityText) activityText.textContent = discordConfig.fallbackActivity;
      if (activityMeta) activityMeta.hidden = true;
      if (activityVisual) activityVisual.hidden = true;
    };

    applyFallback();

    const userId = (discordConfig.userId || '').trim();
    if (!/^\d{17,20}$/.test(userId)) {
      return;
    }

    let activeTimestamps = null;

    const updateProgressBar = () => {
      if (!activeTimestamps || !activityMeta || !activityElapsed) return;
      const now = Date.now();
      const start = activeTimestamps.start;
      const end = activeTimestamps.end;

      if (start && end && end > start) {
        const total = end - start;
        const done = Math.max(0, Math.min(total, now - start));
        const pct = (done / total) * 100;
        const elapsedMin = Math.floor(done / 60000);
        const remSec = Math.max(0, Math.floor((end - now) / 1000));
        activityElapsed.textContent = `${elapsedMin}M`;
        if (activityProgressFill) activityProgressFill.style.width = `${pct.toFixed(1)}%`;
        if (activityRemaining) {
          const rm = Math.floor(remSec / 60);
          const rs = String(remSec % 60).padStart(2, '0');
          activityRemaining.textContent = `-${rm}:${rs}`;
        }
        activityMeta.hidden = false;
      } else if (start) {
        const mins = Math.max(0, Math.floor((now - start) / 60000));
        activityElapsed.textContent = `ACTIVE ${mins}M`;
        if (activityProgressFill) activityProgressFill.style.width = '100%';
        if (activityRemaining) activityRemaining.textContent = '';
        activityMeta.hidden = false;
      } else {
        activityMeta.hidden = true;
      }
    };

    const fetchLanyard = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !json.data) return;

        const d = json.data;
        const st = d.discord_status || 'offline';
        if (statusDot) statusDot.setAttribute('data-status', st);
        if (statusText) statusText.textContent = st;

        const game = (d.activities || []).find((a) => a.type === 0 || a.type === 2);
        if (game) {
          const line = [game.name, game.details || game.state].filter(Boolean).join(' · ');
          if (activityText) activityText.textContent = line;
          activeTimestamps = game.timestamps || null;
          updateProgressBar();

          const largeImg = game.assets && game.assets.large_image;
          if (largeImg && activityIcon && activityVisual) {
            const url = largeImg.startsWith('mp:external/')
              ? `https://media.discordapp.net/external/${largeImg.slice('mp:external/'.length)}`
              : `https://cdn.discordapp.com/app-assets/${game.application_id}/${largeImg}.png`;
            activityIcon.src = url;
            activityVisual.hidden = false;
          } else if (activityVisual) {
            activityVisual.hidden = true;
          }
        } else {
          activeTimestamps = null;
          if (activityText) activityText.textContent = discordConfig.fallbackActivity;
          if (activityMeta) activityMeta.hidden = true;
          if (activityVisual) activityVisual.hidden = true;
        }
      } catch (_) {}
    };

    fetchLanyard();
    window.setInterval(fetchLanyard, 20000);
    window.setInterval(updateProgressBar, 1000);
  }

  ns.bioWidgets = {
    initBioDrawer,
    initMoscowClock,
    initErrorWords,
    initFavoriteTabs,
    initCarousels,
    initDiscordPresence,
  };
})(window.NightmareSite = window.NightmareSite || {});
