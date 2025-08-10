const audioPlayer = document.getElementById('audio-player');
const playButtons = document.querySelectorAll('.play-btn');
let currentPlayingBtn = null;

// 取得純檔名（不含路徑）
const getFileName = url => url.substring(url.lastIndexOf('/') + 1);

playButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const track = btn.closest('.track');
    const audioSrc = track.getAttribute('data-audio');
    const currentSrc = getFileName(audioPlayer.src);

    // 同一首歌播放中，則暫停
    if (audioPlayer.src && currentSrc === audioSrc && !audioPlayer.paused) {
      audioPlayer.pause();
      updateButton(btn, false);
      currentPlayingBtn = null;
      return;
    }

    // 播放新歌
    audioPlayer.src = audioSrc;
    audioPlayer.play().catch(() => {
      alert('無法載入音樂檔案！');
      updateButton(btn, false);
    });

    // 重置之前的播放按鈕
    if (currentPlayingBtn && currentPlayingBtn !== btn) {
      updateButton(currentPlayingBtn, false);
    }

    updateButton(btn, true);
    currentPlayingBtn = btn;
  });

  // 鍵盤 Enter/Space 支援
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

// 音樂播放結束，恢復按鈕狀態
audioPlayer.addEventListener('ended', () => {
  if (currentPlayingBtn) {
    updateButton(currentPlayingBtn, false);
    currentPlayingBtn = null;
  }
});

// 按鈕狀態更新函式，帶簡單動畫效果
function updateButton(button, isPlaying) {
  button.textContent = isPlaying ? '⏸ Pause' : '▶️ Play';
  button.classList.toggle('playing', isPlaying);
  // 加個顏色過渡效果 (CSS 裡要有對應樣式)
}
