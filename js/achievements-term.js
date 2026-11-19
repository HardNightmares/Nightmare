'use strict';

(function (ns) {
  const STORAGE_ACHIEVEMENTS = 'nightmare_achievements_v2';
  const STORAGE_VISITS = 'nightmare_visits_v2';

  class AchievementsAndTerminal {
    constructor({ siteConfig, showCopyToast }) {
      this.config = siteConfig;
      this.showCopyToast = showCopyToast;

      this.unlocked = this._loadUnlocked();
      this.toastQueue = [];
      this.isToastShowing = false;
      this.explorerFlags = { bio: false, audio: false, link: false };

      this.hubBtn = document.getElementById('achievementToggle');
      this.hubCount = document.getElementById('achievementCount');
      this.panel = document.getElementById('achievementPanel');
      this.panelCount = document.getElementById('achievementPanelCount');
      this.listItems = Array.from(document.querySelectorAll('#achievementList li[data-achievement]'));

      this.toast = document.getElementById('achievementToast');
      this.toastTitle = document.getElementById('achievementToastTitle');
      this.toastDesc = document.getElementById('achievementToastDescription');

      this.terminal = document.getElementById('secretTerminal');
      this.terminalTitle = document.getElementById('terminalTitle');
      this.terminalClose = document.getElementById('terminalClose');
      this.terminalOutput = document.getElementById('terminalOutput');
      this.terminalForm = document.getElementById('terminalForm');
      this.terminalPrompt = document.getElementById('terminalPrompt');
      this.terminalInput = document.getElementById('terminalInput');
      this.viewsTrigger = document.getElementById('viewsEasterEgg');
      this.visitCountEl = document.getElementById('visitCount');
      this.avatarWrap = document.getElementById('avatarWrap');

      this._hydrateTerminalLabels();
      this._initVisitCounter();
      this._initAchievementPanel();
      this._initEasterEggs();
      this._initTerminalEvents();
      this._syncUI();
    }

    _loadUnlocked() {
      try {
        const raw = localStorage.getItem(STORAGE_ACHIEVEMENTS);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch (_) {
        return new Set();
      }
    }

    _saveUnlocked() {
      try {
        localStorage.setItem(STORAGE_ACHIEVEMENTS, JSON.stringify([...this.unlocked]));
      } catch (_) {}
    }

    _hydrateTerminalLabels() {
      if (this.terminalTitle) this.terminalTitle.textContent = this.config.terminal.title;
      if (this.terminalPrompt) this.terminalPrompt.textContent = this.config.terminal.prompt;
    }

    _initVisitCounter() {
      let visits = 1;
      try {
        const prev = Number(localStorage.getItem(STORAGE_VISITS) || '0');
        visits = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
        localStorage.setItem(STORAGE_VISITS, String(visits));
      } catch (_) {
        visits = 1;
      }

      if (this.visitCountEl) {
        this.visitCountEl.textContent = String(visits);
      }

      if (visits >= 2) {
        window.setTimeout(() => this.unlock('welcome'), 1400);
      }

      const hour = new Date().getHours();
      if (hour >= 0 && hour < 6) {
        window.setTimeout(() => this.unlock('night'), 2200);
      }
    }

    _initAchievementPanel() {
      if (!this.hubBtn || !this.panel) return;
      let hideTimer = 0;

      const closePanel = () => {
        this.panel.classList.remove('is-open');
        this.hubBtn.classList.remove('is-open');
        this.hubBtn.setAttribute('aria-expanded', 'false');
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          if (!this.panel.classList.contains('is-open')) {
            this.panel.hidden = true;
          }
        }, 260);
      };

      const openPanel = () => {
        window.clearTimeout(hideTimer);
        this.panel.hidden = false;
        void this.panel.offsetHeight;
        this.panel.classList.add('is-open');
        this.hubBtn.classList.add('is-open');
        this.hubBtn.setAttribute('aria-expanded', 'true');
      };

      this.hubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.panel.classList.contains('is-open')) {
          closePanel();
        } else {
          openPanel();
        }
      });

      document.addEventListener('click', (e) => {
        if (
          this.panel.classList.contains('is-open') &&
          e.target &&
          !this.panel.contains(e.target) &&
          !this.hubBtn.contains(e.target)
        ) {
          closePanel();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.panel.classList.contains('is-open')) {
          closePanel();
        }
      });
    }

    _initEasterEggs() {
      let avatarClicks = 0;
      let avatarReset = 0;
      const triggerAvatarClick = () => {
        avatarClicks += 1;
        window.clearTimeout(avatarReset);
        avatarReset = window.setTimeout(() => {
          avatarClicks = 0;
        }, 2200);

        if (avatarClicks >= 5) {
          avatarClicks = 0;
          if (this.avatarWrap) this.avatarWrap.classList.toggle('is-awakened');
          this.unlock('avatar');
        }
      };

      if (this.avatarWrap) {
        this.avatarWrap.addEventListener('click', triggerAvatarClick);
        this.avatarWrap.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerAvatarClick();
          }
        });
      }

      let viewClicks = 0;
      let viewReset = 0;
      const triggerViewsClick = () => {
        viewClicks += 1;
        window.clearTimeout(viewReset);
        viewReset = window.setTimeout(() => {
          viewClicks = 0;
        }, 2400);

        if (viewClicks >= 5) {
          viewClicks = 0;
          this.openTerminal();
        }
      };

      if (this.viewsTrigger) {
        this.viewsTrigger.addEventListener('click', triggerViewsClick);
        this.viewsTrigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerViewsClick();
          }
        });
      }

      window.addEventListener('keydown', (e) => {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === '`' || e.key === '~' || e.key === 'ё' || e.key === 'Ё') {
          e.preventDefault();
          this.openTerminal();
        }
      });
    }

    _initTerminalEvents() {
      if (this.terminalClose) {
        this.terminalClose.addEventListener('click', () => this.closeTerminal());
      }

      if (this.terminal) {
        this.terminal.addEventListener('click', (e) => {
          if (e.target === this.terminal) this.closeTerminal();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.terminal && this.terminal.classList.contains('is-open')) {
          this.closeTerminal();
        }
      });

      if (this.terminalForm) {
        this.terminalForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!this.terminalInput) return;
          const raw = this.terminalInput.value.trim();
          this.terminalInput.value = '';
          if (!raw) return;
          this._appendLine('guest:', raw);
          this._executeCommand(raw);
        });
      }
    }

    openTerminal() {
      if (!this.terminal) return;
      this.terminal.hidden = false;
      void this.terminal.offsetHeight;
      this.terminal.classList.add('is-open');
      this.unlock('terminal');
      window.setTimeout(() => {
        if (this.terminalInput) this.terminalInput.focus();
      }, 60);
    }

    closeTerminal() {
      if (!this.terminal) return;
      this.terminal.classList.remove('is-open');
      window.setTimeout(() => {
        if (this.terminal && !this.terminal.classList.contains('is-open')) {
          this.terminal.hidden = true;
        }
      }, 260);
    }

    _appendLine(prefix, text) {
      if (!this.terminalOutput) return;
      const p = document.createElement('p');
      const b = document.createElement('b');
      b.textContent = `${prefix} `;
      p.appendChild(b);
      p.appendChild(document.createTextNode(text));
      this.terminalOutput.appendChild(p);
      this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    _executeCommand(raw) {
      const cmd = raw.toLowerCase().trim();
      const secret = this.config.terminal.secretPhrase.toLowerCase();

      if (cmd === secret || cmd === 'one piece is real') {
        this._appendLine(
          'system:',
          `signal verified — "${this.config.terminal.secretAchievementTitle}" unlocked.`
        );
        this.unlock('secretphrase');
        return;
      }

      switch (cmd) {
        case 'help':
          this._appendLine('system:', 'commands: help | whoami | bio | links | track | clear | exit');
          this._appendLine('hint:', 'some phrases from The Last of Us unlock hidden memory...');
          break;
        case 'whoami':
          this._appendLine(
            'profile:',
            `${this.config.identity.displayName} (tg: ${this.config.identity.copyTag}, discord: ${this.config.identity.username})`
          );
          break;
        case 'bio':
          this._appendLine(
            'bio:',
            `NAME=${this.config.bio.name} | BDAY=${this.config.bio.birthday} | COUNTRY=${this.config.bio.country} | GAMES=${this.config.bio.favorites.games.join(', ')}`
          );
          break;
        case 'links':
          this.config.socials.forEach((s) => {
            this._appendLine(`${s.label.toLowerCase()}:`, s.action === 'copy' ? s.copyValue || '' : s.href);
          });
          break;
        case 'track': {
          const first = this.config.tracks[0];
          const srcInfo = this.config.audioMode === 'video' ? ' [video audio]' : '';
          this._appendLine('audio:', first ? `${first.artist} — ${first.title}${srcInfo}` : 'no track');
          break;
        }
        case 'clear':
          if (this.terminalOutput) this.terminalOutput.textContent = '';
          break;
        case 'exit':
          this.closeTerminal();
          break;
        default:
          this._appendLine('error:', `unknown command "${raw}". Type "help".`);
      }
    }

    markExplorerStep(step) {
      this.explorerFlags[step] = true;
      if (this.explorerFlags.bio && this.explorerFlags.audio && this.explorerFlags.link) {
        this.unlock('explorer');
      }
    }

    unlock(id) {
      if (this.unlocked.has(id)) return;
      const item = this.listItems.find((li) => li.getAttribute('data-achievement') === id);
      if (!item) return;

      this.unlocked.add(id);
      this._saveUnlocked();
      this._syncUI();

      const b = item.querySelector('b');
      const span = item.querySelector('span');
      const title = item.dataset.title || (b ? b.textContent : id.toUpperCase());
      const description = item.dataset.description || (span ? span.textContent : '');

      this.toastQueue.push({ title, description });
      this._flushToastQueue();
    }

    _syncUI() {
      const total = this.listItems.length;
      const count = this.unlocked.size;

      if (this.hubCount) this.hubCount.textContent = `${count}/${total}`;
      if (this.panelCount) this.panelCount.textContent = `${count} / ${total}`;

      this.listItems.forEach((li) => {
        const id = li.getAttribute('data-achievement') || '';
        const isUnlocked = this.unlocked.has(id);
        li.classList.toggle('is-unlocked', isUnlocked);

        const b = li.querySelector('b');
        const span = li.querySelector('span');

        if (isUnlocked && li.hasAttribute('data-secret')) {
          if (b && li.dataset.title) b.textContent = li.dataset.title;
          if (span && li.dataset.description) span.textContent = li.dataset.description;
        } else if (isUnlocked && li.hasAttribute('data-secret-description')) {
          if (span && li.dataset.description) span.textContent = li.dataset.description;
        }
      });
    }

    _flushToastQueue() {
      if (this.isToastShowing || !this.toastQueue.length || !this.toast) return;
      this.isToastShowing = true;

      const next = this.toastQueue.shift();
      if (!next) {
        this.isToastShowing = false;
        return;
      }

      if (this.toastTitle) this.toastTitle.textContent = next.title;
      if (this.toastDesc) this.toastDesc.textContent = next.description;

      this.toast.classList.add('is-visible');
      window.setTimeout(() => {
        if (this.toast) this.toast.classList.remove('is-visible');
        window.setTimeout(() => {
          this.isToastShowing = false;
          this._flushToastQueue();
        }, 360);
      }, 3400);
    }
  }

  ns.AchievementsAndTerminal = AchievementsAndTerminal;
})(window.NightmareSite = window.NightmareSite || {});
