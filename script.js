const audioPlayer = document.getElementById('audio-player');
const playButtons = document.querySelectorAll('.play-btn');
let currentPlayingBtn = null;

playButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const trackSection = btn.closest('.track');
    const audioSrc = trackSection.getAttribute('data-audio');

    if (audioPlayer.src && audioPlayer.src.includes(audioSrc) && !audioPlayer.paused) {
      audioPlayer.pause();
      btn.textContent = '▶️ Play';
      btn.classList.remove('playing');
      currentPlayingBtn = null;
    } else {
      audioPlayer.src = audioSrc;
      audioPlayer.play();
      if (currentPlayingBtn) {
        currentPlayingBtn.textContent = '▶️ Play';
        currentPlayingBtn.classList.remove('playing');
      }
      btn.textContent = '⏸ Pause';
      btn.classList.add('playing');
      currentPlayingBtn = btn;
    }
  });
});

audioPlayer.addEventListener('ended', () => {
  if (currentPlayingBtn) {
    currentPlayingBtn.textContent = '▶️ Play';
    currentPlayingBtn.classList.remove('playing');
    currentPlayingBtn = null;
  }
});
