'use strict';

(function (ns) {
  const SITE_CONFIG = ns.CONFIG;

  const SOCIAL_SVGS = {
    telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.2 4.3 2.9 11.4c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 10.9-6.9c.5-.3 1-.1.6.2L10.1 15.6l-.3 4.8c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.5-1.5Z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.8 5.4A16.5 16.5 0 0 0 15.7 4c-.2.3-.4.8-.5 1.1a15.3 15.3 0 0 0-4.4 0c-.2-.4-.3-.8-.5-1.1a16.5 16.5 0 0 0-4.1 1.4C3.6 9.3 2.9 13.1 3.2 16.8a16.7 16.7 0 0 0 5 2.6c.4-.6.8-1.2 1.1-1.8-.6-.2-1.2-.5-1.7-.8l.4-.3c3.3 1.5 6.8 1.5 10 0l.4.3c-.6.3-1.1.6-1.7.8.3.6.7 1.2 1.1 1.8a16.7 16.7 0 0 0 5-2.6c.4-4.3-.7-8.1-2-11.4ZM9.1 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm5.8 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>`,
    steam: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-9.9 8.7l5.4 2.2a2.9 2.9 0 0 1 1.7-.5h.2l2.4-3.5v-.1a3.8 3.8 0 1 1 3.8 3.8h-.1l-3.4 2.5v.2a2.9 2.9 0 0 1-5.7.6l-3.9-1.6A10 10 0 1 0 12 2Zm-3.1 13.4-1.3-.5a2.1 2.1 0 0 0 3.9-.2 2.1 2.1 0 0 0-1.1-2.8l1.3.5a1.5 1.5 0 1 1-1.2 2.8l-1.6.2Zm6.7-5.9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C2 9 2 12 2 12s0 3 .4 4.8a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.8.4-4.8.4-4.8s0-3-.4-4.8ZM10 15.1V8.9l5.2 3.1L10 15.1Z"/></svg>`,
  };

  function createCopyToast() {
    const toastEl = document.getElementById('copyToast');
    let timer = 0;

    return (message) => {
      if (!toastEl) return;
      toastEl.textContent = message;
      toastEl.classList.add('is-visible');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        toastEl.classList.remove('is-visible');
      }, 2200);
    };
  }

  async function copyToClipboard(value, notify) {
    try {
      await navigator.clipboard.writeText(value);
      notify(`Copied ${value}`);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = value;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      notify(`Copied ${value}`);
    }
  }

  function hydrateProfile(showToast, onSocialClick) {
    document.title = SITE_CONFIG.identity.pageTitle;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText('displayName', SITE_CONFIG.identity.displayName);
    setText('subtitleOne', SITE_CONFIG.identity.subtitles[0] || '');
    setText('subtitleTwo', SITE_CONFIG.identity.subtitles[1] || '');
    setText('subtitleThree', SITE_CONFIG.identity.subtitles[2] || '');
    setText('telegramCtaLabel', SITE_CONFIG.identity.locationLabel);
    setText('telegramCtaTooltip', SITE_CONFIG.identity.locationTooltip);
    setText('username', SITE_CONFIG.identity.username);
    setText('guildTag', SITE_CONFIG.identity.guildTag);

    const badge = document.getElementById('developerBadge');
    if (badge) {
      badge.setAttribute('data-tooltip', SITE_CONFIG.identity.badgeLabel);
      badge.setAttribute('aria-label', SITE_CONFIG.identity.badgeLabel);
    }

    const tgCta = document.getElementById('telegramCta');
    if (tgCta) {
      tgCta.href = SITE_CONFIG.identity.locationUrl;
      tgCta.addEventListener('click', onSocialClick);
    }

    const displayNameBtn = document.getElementById('displayName');
    if (displayNameBtn) {
      displayNameBtn.addEventListener('click', () => {
        copyToClipboard(SITE_CONFIG.identity.copyTag, showToast);
      });
    }

    const usernameBtn = document.getElementById('username');
    if (usernameBtn) {
      usernameBtn.addEventListener('click', () => {
        copyToClipboard(SITE_CONFIG.identity.discordCopy || SITE_CONFIG.identity.username, showToast);
      });
    }

    const video = document.getElementById('backgroundVideo');
    if (video) {
      if (SITE_CONFIG.media.posterSrc) video.poster = SITE_CONFIG.media.posterSrc;
      if (video.getAttribute('src') !== SITE_CONFIG.media.videoSrc) {
        video.src = SITE_CONFIG.media.videoSrc;
        video.load();
      }
    }

    const avatar = document.getElementById('avatar');
    if (avatar) {
      avatar.src = SITE_CONFIG.media.avatarSrc;
    }

    setText('bioName', SITE_CONFIG.bio.name);
    setText('bioBirthday', SITE_CONFIG.bio.birthday);
    setText('bioPhone', SITE_CONFIG.bio.phone);
    setText('bioCountry', SITE_CONFIG.bio.country);

    const socialsNav = document.getElementById('socialsNav');
    if (socialsNav) {
      socialsNav.textContent = '';
      SITE_CONFIG.socials.forEach((item) => {
        const a = document.createElement('a');
        a.className = 'social-link magnetic';
        a.href = item.href;
        a.setAttribute('aria-label', item.label);
        a.setAttribute('data-tooltip', item.tooltip);
        a.innerHTML = SOCIAL_SVGS[item.id] || SOCIAL_SVGS.telegram;

        if (item.action === 'link') {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.addEventListener('click', onSocialClick);
        } else {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            onSocialClick();
            copyToClipboard(item.copyValue || SITE_CONFIG.identity.username, showToast);
          });
        }

        socialsNav.appendChild(a);
      });
    }
  }

  function initEntryScreen(video, player) {
    const entryScreen = document.getElementById('entryScreen');
    const entryStatus = document.getElementById('entryStatus');
    if (!entryScreen || !entryStatus) return;

    let isReady = false;
    let isEntered = false;

    const markReady = () => {
      if (isReady) return;
      isReady = true;
      entryScreen.classList.remove('is-loading');
      entryScreen.classList.add('is-ready');
      entryStatus.textContent = 'CLICK TO ENTER';
    };

    const fontsReady = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const videoReady = new Promise((resolve) => {
      if (!video || video.readyState >= 2) {
        resolve(true);
        return;
      }
      const done = () => resolve(true);
      video.addEventListener('loadeddata', done, { once: true });
      video.addEventListener('error', done, { once: true });
    });

    Promise.race([
      Promise.all([fontsReady, videoReady]),
      new Promise((resolve) => window.setTimeout(resolve, 900)),
    ]).then(markReady);

    const enterProfile = () => {
      if (isEntered) return;
      isEntered = true;

      // Запускает оригинальное видео и сразу включает его звуковую дорожку
      player.startOnEnter();

      entryScreen.classList.add('is-dismissed');
      document.body.classList.remove('is-entering');
      document.body.classList.add('is-entered');

      window.setTimeout(() => {
        entryScreen.setAttribute('aria-hidden', 'true');
      }, 750);
    };

    entryScreen.addEventListener('click', enterProfile);
    entryScreen.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterProfile();
      }
    });
  }

  function bootstrap() {
    if (!SITE_CONFIG) return;
    const showToast = createCopyToast();

    const system = new ns.AchievementsAndTerminal({
      siteConfig: SITE_CONFIG,
      showCopyToast: showToast,
    });

    hydrateProfile(showToast, () => {
      system.markExplorerStep('link');
    });

    const video = document.getElementById('backgroundVideo');

    const player = new ns.RealAudioPlayer({
      audioMode: SITE_CONFIG.audioMode,
      videoElement: video,
      tracks: SITE_CONFIG.tracks,
      defaultCover: SITE_CONFIG.media.avatarSrc,
      onInteract: () => {
        system.unlock('sound');
        system.markExplorerStep('audio');
      },
    });

    ns.bioWidgets.initBioDrawer(() => {
      system.markExplorerStep('bio');
    });
    ns.bioWidgets.initMoscowClock(SITE_CONFIG.bio.timezone);
    ns.bioWidgets.initErrorWords(showToast);
    ns.bioWidgets.initFavoriteTabs();
    ns.bioWidgets.initCarousels({
      games: SITE_CONFIG.bio.favorites.games,
      movies: SITE_CONFIG.bio.favorites.movies,
      likes: SITE_CONFIG.bio.likes,
    });
    ns.bioWidgets.initDiscordPresence(SITE_CONFIG.discord);

    initEntryScreen(video, player);
    ns.initCursorAndMagnetics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})(window.NightmareSite = window.NightmareSite || {});
