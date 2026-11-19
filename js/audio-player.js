'use strict';

(function (ns) {
  const VOLUME_STORAGE_KEY = 'nightmare_volume_v2';

  const VOLUME_ICONS = {
    muted: `<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Zm4.6 4.4-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4-2.2-2.2 2.2-2.2-1.4-1.4-2.2 2.2-2.2-2.2Z"/></svg>`,
    low: `<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Zm4.5 7a3.5 3.5 0 0 0-1.9-3.1v6.2A3.5 3.5 0 0 0 15.5 12Z"/></svg>`,
    high: `<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Zm3.5 2.4v1.9a4.5 4.5 0 0 1 0 5.4v1.9a6.5 6.5 0 0 0 0-9.2Zm0 2.9v3.4a2.3 2.3 0 0 0 0-3.4Z"/></svg>`,
  };

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setRangeFill(input, percent) {
    if (!input) return;
    const clamped = Math.max(0, Math.min(100, percent));
    input.style.setProperty('--fill', `${clamped}%`);
  }

  class RealAudioPlayer {
    constructor({ audioMode, videoElement, tracks, defaultCover, onInteract }) {
      this.audioMode = audioMode === 'tracks' ? 'tracks' : 'video';
      this.video = videoElement;
      this.audio = document.getElementById('trackAudio');
      this.media = this.audioMode === 'video' && this.video ? this.video : this.audio;
      this.tracks = Array.isArray(tracks) ? tracks : [];
      this.defaultCover = defaultCover || 'assets/avatar.png';
      this.onInteract = onInteract || function () {};

      this.currentIndex = 0;
      this.isSeeking = false;
      this.isMuted = false;
      this.lastVolume = this._readSavedVolume();
      this.hasEntered = false;

      // Web Audio FFT состояние
      this.audioCtx = null;
      this.analyser = null;
      this.fftData = null;
      this.fftConnected = false;
      this.corsFallbackUsed = false;
      this.activeSourceQueue = [];
      this.sourceCursor = 0;
      this.rafId = 0;

      // DOM-узлы
      this.card = document.getElementById('trackCard');
      this.cover = document.getElementById('trackCover');
      this.loader = document.getElementById('trackLoader');
      this.visualizerBars = Array.from(document.querySelectorAll('#trackVisualizer i'));
      this.titleEl = document.getElementById('trackTitle');
      this.artistEl = document.getElementById('trackArtist');
      this.feedback = document.getElementById('trackFeedback');
      this.feedbackText = document.getElementById('trackFeedbackText');
      this.retryBtn = document.getElementById('trackRetry');
      this.currentEl = document.getElementById('trackCurrent');
      this.durationEl = document.getElementById('trackDuration');
      this.progressInput = document.getElementById('trackProgress');
      this.prevBtn = document.getElementById('trackPrev');
      this.playBtn = document.getElementById('trackPlay');
      this.nextBtn = document.getElementById('trackNext');

      this.soundControl = document.getElementById('soundControl');
      this.soundToggle = document.getElementById('soundToggle');
      this.soundIcon = document.getElementById('soundIcon');
      this.volumeSlider = document.getElementById('volumeSlider');

      this._bindControls();
      this._bindMediaEvents();
      this._renderTrackMetadata(0);

      // До нажатия на экран входа видео должно оставаться без звука (требование браузеров)
      this._updateVolumeUI(this.lastVolume);
      if (this.audioMode === 'video' && this.video) {
        this.video.muted = true;
        this.video.volume = this.lastVolume / 100;
        if (Number.isFinite(this.video.duration) && this.video.duration > 0 && this.durationEl) {
          this.durationEl.textContent = formatTime(this.video.duration);
        }
      } else {
        this._applyVolume(this.lastVolume, false);
        this.loadTrack(0, false);
      }
    }

    _readSavedVolume() {
      try {
        const saved = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
        if (Number.isFinite(saved) && saved >= 0 && saved <= 100) {
          return saved;
        }
      } catch (_) {}
      return 80;
    }

    _saveVolume(val) {
      try {
        localStorage.setItem(VOLUME_STORAGE_KEY, String(val));
      } catch (_) {}
    }

    _renderTrackMetadata(index) {
      const track = this.tracks[index] || {
        title: 'Yaderi',
        artist: 'Rory in early 20s',
        cover: this.defaultCover,
      };
      if (this.titleEl) this.titleEl.textContent = track.title;
      if (this.artistEl) this.artistEl.textContent = track.artist;
      if (this.cover) this.cover.src = track.cover || this.defaultCover;
    }

    _bindControls() {
      if (this.playBtn) {
        this.playBtn.addEventListener('click', () => {
          this.onInteract();
          this.togglePlay();
        });
      }

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.onInteract();
          this.stepTrack(-1);
        });
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.onInteract();
          this.stepTrack(1);
        });
      }

      if (this.retryBtn) {
        this.retryBtn.addEventListener('click', () => {
          this.onInteract();
          if (this.audioMode === 'video') {
            this.play();
          } else {
            this.loadTrack(this.currentIndex, true);
          }
        });
      }

      if (this.progressInput) {
        this.progressInput.addEventListener('pointerdown', () => {
          this.isSeeking = true;
        });

        this.progressInput.addEventListener('input', () => {
          const val = Number(this.progressInput.value);
          setRangeFill(this.progressInput, val / 10);
          if (this.media && Number.isFinite(this.media.duration) && this.media.duration > 0) {
            const previewSec = (val / 1000) * this.media.duration;
            if (this.currentEl) this.currentEl.textContent = formatTime(previewSec);
          }
        });

        const commitSeek = () => {
          if (!this.isSeeking) return;
          this.isSeeking = false;
          if (this.media && Number.isFinite(this.media.duration) && this.media.duration > 0) {
            this.media.currentTime = (Number(this.progressInput.value) / 1000) * this.media.duration;
          }
        };

        this.progressInput.addEventListener('change', commitSeek);
        window.addEventListener('pointerup', commitSeek);
      }

      if (this.soundToggle) {
        this.soundToggle.addEventListener('click', () => {
          this.onInteract();
          if (this.isMuted || (this.media && (this.media.muted || this.media.volume === 0))) {
            this.isMuted = false;
            const restore = this.lastVolume > 5 ? this.lastVolume : 70;
            this._applyVolume(restore, true);
          } else {
            this.isMuted = true;
            this._applyVolume(0, false);
          }
        });
      }

      if (this.volumeSlider) {
        this.volumeSlider.addEventListener('input', () => {
          const val = Number(this.volumeSlider.value);
          this.isMuted = val === 0;
          if (val > 0) this.lastVolume = val;
          this._applyVolume(val, true);
        });
      }
    }

    _bindMediaEvents() {
      if (!this.media) return;

      this.media.addEventListener('waiting', () => this._setLoading(true));
      this.media.addEventListener('canplay', () => {
        this._setLoading(false);
        this._hideFeedback();
      });

      this.media.addEventListener('loadedmetadata', () => {
        if (this.durationEl && Number.isFinite(this.media.duration)) {
          this.durationEl.textContent = formatTime(this.media.duration);
        }
      });

      this.media.addEventListener('timeupdate', () => {
        if (this.isSeeking || !this.media) return;
        const dur = this.media.duration;
        const cur = this.media.currentTime;
        if (this.currentEl) this.currentEl.textContent = formatTime(cur);
        if (this.durationEl && Number.isFinite(dur) && dur > 0) {
          this.durationEl.textContent = formatTime(dur);
        }
        if (Number.isFinite(dur) && dur > 0 && this.progressInput) {
          const ratio = cur / dur;
          this.progressInput.value = String(Math.round(ratio * 1000));
          setRangeFill(this.progressInput, ratio * 100);
        }
      });

      this.media.addEventListener('play', () => {
        if (this.card) this.card.classList.add('is-playing');
        this._hideFeedback();
        this._startVisualizerLoop();
      });

      this.media.addEventListener('pause', () => {
        if (this.card) this.card.classList.remove('is-playing');
        this._stopVisualizerLoop();
      });

      this.media.addEventListener('ended', () => {
        if (this.audioMode === 'tracks') {
          if (this.tracks.length > 1) {
            this.stepTrack(1);
          } else {
            this.media.currentTime = 0;
            this.media.play().catch(() => {});
          }
        }
      });

      this.media.addEventListener('error', () => {
        if (this.audioMode === 'tracks') {
          this._handleTrackError();
        } else {
          this._setLoading(false);
          this._showFeedback('Не удалось загрузить assets/background.mp4', true);
        }
      });
    }

    /**
     * Запускается по клику на экран входа: включает видео + его родной звук
     */
    async startOnEnter() {
      this.hasEntered = true;
      const targetVol = this.isMuted ? 0 : this.lastVolume;
      this._applyVolume(targetVol, false);

      if (this.audioMode === 'video' && this.video) {
        this.video.muted = targetVol === 0;
        this._tryConnectFFT();
        try {
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
          }
          await this.video.play();
        } catch (_) {
          // Если браузер всё ещё блокирует звук — запускаем видео и просим клик по Play
          this.video.muted = true;
          this.video.play().catch(() => {});
          this._showFeedback('Нажми Play для включения звука', false);
        }
      } else {
        if (this.video) {
          this.video.muted = true;
          this.video.play().catch(() => {});
        }
        await this.play();
      }
    }

    loadTrack(index, autoPlay) {
      if (!this.tracks.length) return;
      this.currentIndex = (index + this.tracks.length) % this.tracks.length;
      const track = this.tracks[this.currentIndex];
      this._renderTrackMetadata(this.currentIndex);

      if (this.audioMode === 'video') {
        if (this.video) {
          this.video.currentTime = 0;
          if (autoPlay) this.play();
        }
        return;
      }

      if (this.currentEl) this.currentEl.textContent = '0:00';
      if (this.durationEl) this.durationEl.textContent = '0:00';
      if (this.progressInput) {
        this.progressInput.value = '0';
        setRangeFill(this.progressInput, 0);
      }

      this.activeSourceQueue = [track.streamUrl, track.localSrc].filter(
        (src) => typeof src === 'string' && src.trim().length > 0
      );
      this.sourceCursor = 0;
      this.corsFallbackUsed = false;

      if (!this.activeSourceQueue.length) {
        this._showFeedback('Добавь MP3 в assets/ или переключи audioMode на video', false);
        return;
      }
      this._loadCurrentTrackSource(autoPlay);
    }

    _loadCurrentTrackSource(autoPlay) {
      const src = this.activeSourceQueue[this.sourceCursor];
      if (!src || !this.audio) return;

      this._hideFeedback();
      this._setLoading(true);

      const isFileProtocol = window.location.protocol === 'file:';
      if (isFileProtocol || this.corsFallbackUsed) {
        this.audio.removeAttribute('crossorigin');
      } else {
        this.audio.setAttribute('crossorigin', 'anonymous');
      }

      this.audio.src = src;
      this.audio.load();

      if (autoPlay) {
        this.play();
      } else {
        this._setLoading(false);
      }
    }

    _handleTrackError() {
      this._setLoading(false);
      if (!this.corsFallbackUsed && this.audio && this.audio.hasAttribute('crossorigin') && !this.fftConnected) {
        this.corsFallbackUsed = true;
        this._loadCurrentTrackSource(!this.audio.paused);
        return;
      }
      if (this.sourceCursor + 1 < this.activeSourceQueue.length) {
        this.sourceCursor += 1;
        this.corsFallbackUsed = false;
        this._loadCurrentTrackSource(true);
        return;
      }
      if (this.card) this.card.classList.remove('is-playing');
      this._showFeedback('Трек не найден: добавь assets/yaderi.mp3 или URL в config.js', true);
    }

    async play() {
      if (!this.media) return;
      if (this.audioMode === 'video' && this.hasEntered && !this.isMuted && this.lastVolume > 0) {
        this.media.muted = false;
        this.media.volume = this.lastVolume / 100;
      }
      this._tryConnectFFT();
      try {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        await this.media.play();
      } catch (err) {
        if (err && err.name === 'NotAllowedError') {
          this._showFeedback('Нажми Play для запуска звука', false);
        }
      }
    }

    pause() {
      if (this.media) this.media.pause();
    }

    togglePlay() {
      if (!this.media) return;
      if (this.media.paused) {
        this.play();
      } else {
        this.pause();
      }
    }

    stepTrack(delta) {
      if (this.audioMode === 'video' || this.tracks.length <= 1) {
        if (this.media) {
          this.media.currentTime = 0;
          this.play();
        }
        return;
      }
      this.loadTrack(this.currentIndex + delta, true);
    }

    _updateVolumeUI(percent) {
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      if (this.volumeSlider) {
        this.volumeSlider.value = String(clamped);
        setRangeFill(this.volumeSlider, clamped);
      }
      if (this.soundControl) {
        this.soundControl.classList.toggle('is-muted', clamped === 0);
      }
      if (this.soundIcon) {
        if (clamped === 0) {
          this.soundIcon.innerHTML = VOLUME_ICONS.muted;
        } else if (clamped < 48) {
          this.soundIcon.innerHTML = VOLUME_ICONS.low;
        } else {
          this.soundIcon.innerHTML = VOLUME_ICONS.high;
        }
      }
    }

    _applyVolume(percent, persist) {
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      if (this.media) {
        this.media.volume = clamped / 100;
        this.media.muted = clamped === 0;
      }
      this._updateVolumeUI(clamped);
      if (persist) {
        this._saveVolume(clamped);
      }
    }

    _tryConnectFFT() {
      // На file:// не подключаем MediaElementSource, чтобы браузер не заглушил звук из-за CORS
      if (
        this.fftConnected ||
        this.corsFallbackUsed ||
        !this.media ||
        window.location.protocol === 'file:'
      ) {
        return;
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this.audioCtx = new Ctx();
        const source = this.audioCtx.createMediaElementSource(this.media);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.78;
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.fftData = new Uint8Array(this.analyser.frequencyBinCount);
        this.fftConnected = true;
      } catch (_) {
        this.fftConnected = false;
      }
    }

    _startVisualizerLoop() {
      cancelAnimationFrame(this.rafId);
      const barCount = this.visualizerBars.length;
      if (!barCount) return;

      const tick = (now) => {
        if (!this.media || this.media.paused) return;

        if (this.fftConnected && this.analyser && this.fftData && !this.media.muted) {
          this.analyser.getByteFrequencyData(this.fftData);
          let energySum = 0;
          for (let i = 0; i < 12; i++) energySum += this.fftData[i];
          if (energySum > 4) {
            for (let i = 0; i < barCount; i++) {
              const bin = Math.min(this.fftData.length - 1, i * 2 + 1);
              const pct = Math.max(14, Math.min(100, Math.round((this.fftData[bin] / 255) * 100)));
              this.visualizerBars[i].style.height = `${pct}%`;
            }
            this.rafId = requestAnimationFrame(tick);
            return;
          }
        }

        const mutedScale = this.media.muted ? 0.25 : 1;
        const t = now * 0.0062;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(t + i * 0.95) * 0.5 + 0.5;
          const sub = Math.cos(t * 1.65 - i * 0.6) * 0.5 + 0.5;
          const pct = Math.round(16 + (wave * 0.6 + sub * 0.4) * 74 * mutedScale);
          this.visualizerBars[i].style.height = `${pct}%`;
        }
        this.rafId = requestAnimationFrame(tick);
      };

      this.rafId = requestAnimationFrame(tick);
    }

    _stopVisualizerLoop() {
      cancelAnimationFrame(this.rafId);
      for (const bar of this.visualizerBars) {
        bar.style.height = '18%';
      }
    }

    _setLoading(active) {
      if (this.loader) this.loader.hidden = !active;
    }

    _showFeedback(message, showRetry) {
      if (this.feedback) this.feedback.hidden = false;
      if (this.feedbackText) this.feedbackText.textContent = message;
      if (this.retryBtn) this.retryBtn.hidden = !showRetry;
    }

    _hideFeedback() {
      if (this.feedback) this.feedback.hidden = true;
      if (this.retryBtn) this.retryBtn.hidden = true;
    }
  }

  ns.RealAudioPlayer = RealAudioPlayer;
})(window.NightmareSite = window.NightmareSite || {});
