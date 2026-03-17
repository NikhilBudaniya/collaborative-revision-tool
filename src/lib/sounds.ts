'use client';

// Sound effect configuration mapping to files in /public/sounds/
const SOUND_FILES = {
  SUCCESS: '/sounds/success.mp3',
  TICK: '/sounds/tick.mp3',
  ALERT: '/sounds/alert.mp3',
};

export function playEffect(effect: keyof typeof SOUND_FILES) {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio(SOUND_FILES[effect]);
    audio.volume = 0.25; // Adjusted for a professional, non-intrusive level
    
    // Use a promise to catch errors from browsers blocking autoplay
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented
        console.debug(`Audio playback for ${effect} was blocked by the browser.`);
      });
    }
  } catch (error) {
    console.error('Error playing sound effect:', error);
  }
}
