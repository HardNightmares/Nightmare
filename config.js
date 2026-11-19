'use strict';

/**
 * Централизованная конфигурация профиля Повстанческий Nightmare.
 * Все медиафайлы воспроизводятся в оригинальном качестве без искажений и перерисовки.
 */
window.NightmareSite = window.NightmareSite || {};

window.NightmareSite.CONFIG = Object.freeze({
  identity: {
    pageTitle: 'Повстанческий Nightmare',
    displayName: 'Повстанческий Nightmare',
    copyTag: '@hard_nightmares',
    username: 'kiskabeybi',
    discordCopy: 'kiskabeybi',
    guildTag: 'NIGHT',
    badgeLabel: 'Creator',
    subtitles: ['GAMER', 'EDITOR', 'CREATOR'],
    locationLabel: 'Telegram',
    locationTooltip: '@hard_nightmares',
    locationUrl: 'https://t.me/hard_nightmares',
  },

  media: {
    // Твоё оригинальное видео 1000066976.mp4 без изменений
    videoSrc: 'assets/background.mp4',
    posterSrc: 'assets/avatar.png',
    // Твоя оригинальная аватарка 1000057915.png без изменений
    avatarSrc: 'assets/avatar.png',
  },

  /**
   * Режим фоновой музыки:
   * - 'video'  : играет реальная звуковая дорожка прямо из фонового видео assets/background.mp4
   * - 'tracks' : играют отдельные MP3-файлы/ссылки из массива tracks ниже (переключишь, когда добавишь песни)
   */
  audioMode: 'video',

  discord: {
    // Если позже впишешь свой 18-значный Discord User ID (и зайдёшь на discord.gg/lanyard),
    // статус и текущая игра будут обновляться в реальном времени.
    userId: '',
    fallbackStatus: 'dnd', // 'online' | 'idle' | 'dnd' | 'offline'
    fallbackActivity: 'The Last of Us · Playing',
    fallbackElapsed: 'ONLINE',
  },

  bio: {
    name: 'DMITRIY',
    birthday: '999',
    phone: 'HIDDEN',
    country: 'RUSSIA',
    timezone: 'Europe/Moscow',
    favorites: {
      games: ['THE LAST OF US', 'THE LAST OF US II', 'PROJECT ZOMBOID', 'CS2'],
      movies: ['THE WALKING DEAD'],
    },
    likes: ['GAMES', 'MOVIES', 'VIDEOMONTAGE', 'MUSIC', 'CODING'],
  },

  /**
   * Название и обложка трека в плеере.
   * Пока audioMode === 'video', название отображается на карточке, а звук идёт из фонового видео.
   * Когда захочешь отдельные песни: поменяй audioMode на 'tracks' и укажи streamUrl или localSrc.
   */
  tracks: [
    {
      title: 'Yaderi',
      artist: 'Rory in early 20s',
      streamUrl: '',
      localSrc: 'assets/yaderi.mp3',
      cover: 'assets/avatar.png',
    },
  ],

  socials: [
    {
      id: 'telegram',
      label: 'Telegram',
      tooltip: 'TELEGRAM',
      href: 'https://t.me/hard_nightmares',
      action: 'link',
    },
    {
      id: 'discord',
      label: 'Discord',
      tooltip: 'COPY DISCORD',
      href: '#discord',
      copyValue: 'kiskabeybi',
      action: 'copy',
    },
    {
      id: 'steam',
      label: 'Steam',
      tooltip: 'STEAM',
      href: 'https://steamcommunity.com/profiles/76561199198823312/',
      action: 'link',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      tooltip: 'YOUTUBE',
      href: 'https://youtube.com/@frez1k2?si=enHzUiLymeICdZQL',
      action: 'link',
    },
  ],

  terminal: {
    title: 'NIGHTMARE // TERMINAL',
    prompt: 'guest@nightmare:~$',
    secretPhrase: 'endure and survive',
    secretAchievementTitle: 'ENDURE AND SURVIVE',
    secretAchievementDesc: 'Произнести легендарную фразу в терминале',
  },
});
