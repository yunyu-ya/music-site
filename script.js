const audioPlayer = document.getElementById('audio-player');
const playButtons = document.querySelectorAll('.play-btn');
let currentPlayingBtn = null;

const getFileName = url => url.substring(url.lastIndexOf('/') + 1);

playButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const track = btn.closest('.track');
    const audioSrc = track.getAttribute('data-audio');
    const currentSrc = getFileName(audioPlayer.src);

    if (audioPlayer.src && currentSrc === audioSrc && !audioPlayer.paused) {
      audioPlayer.pause();
      updateButton(btn, false);
      currentPlayingBtn = null;
      return;
    }

    audioPlayer.src = audioSrc;
    audioPlayer.play().catch(() => {
      alert('無法載入音樂檔案！');
      updateButton(btn, false);
    });

    if (currentPlayingBtn && currentPlayingBtn !== btn) {
      updateButton(currentPlayingBtn, false);
    }

    updateButton(btn, true);
    currentPlayingBtn = btn;
  });

  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

audioPlayer.addEventListener('ended', () => {
  if (currentPlayingBtn) {
    updateButton(currentPlayingBtn, false);
    currentPlayingBtn = null;
  }
});

function updateButton(button, isPlaying) {
  button.textContent = isPlaying ? '⏸ Pause' : '▶️ Play';
  button.classList.toggle('playing', isPlaying);
}
