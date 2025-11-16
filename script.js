const audioPlayer = document.getElementById('audio-player');
const mainPlayBtn = document.getElementById('main-play-btn');
const progressBar = document.getElementById('progress-bar');
const volumeBar = document.getElementById('volume-bar');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const loopAllBtn = document.getElementById('loop-all-btn');
const loopOneBtn = document.getElementById('loop-one-btn');
const shuffleBtn = document.getElementById('shuffle-btn');

const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const nowPlayingEl = document.getElementById('now-playing');
const nowPlayingFloatingEl = document.getElementById('now-playing-floating');

let tracks = []; // 播放清單
let currentTrackIndex = -1;
let playMode = 0; // 0=循環全部, 1=單曲循環, 2=隨機播放
const STORAGE_KEY = 'musicPlayerState';

// 儲存與載入播放狀態
function saveState() {
  if (currentTrackIndex !== -1) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      trackIndex: currentTrackIndex,
      currentTime: audioPlayer.currentTime
    }));
  }
}

function loadState() {
  const state = localStorage.getItem(STORAGE_KEY);
  if (state) {
    try {
      const obj = JSON.parse(state);
      if (obj.trackIndex >= 0 && obj.trackIndex < tracks.length) {
        currentTrackIndex = obj.trackIndex;
        audioPlayer.src = tracks[currentTrackIndex].audio;
        updateNowPlaying();
        audioPlayer.currentTime = obj.currentTime || 0;
      }
    } catch(e) {}
  }
}

// 事件委派：播放按鈕
document.getElementById('tracks-container').addEventListener('click', (e) => {
  if (e.target.classList.contains('play-btn')) {
    const trackSection = e.target.closest('.track, .trash');
    if (!trackSection) return;

    // 將播放清單重建一次
    const allTracks = Array.from(document.querySelectorAll('.track, .trash'));
    tracks = allTracks.map(track => ({
      audio: track.dataset.audio,
      title: track.querySelector('h2').textContent
    }));

    const index = allTracks.indexOf(trackSection);

    if (currentTrackIndex === index) {
      // 同一首歌，切換播放/暫停
      if (audioPlayer.paused) playTrack();
      else pauseTrack();
    } else {
      loadTrack(index);
      playTrack();
    }
  }
});

// 折疊/展開說明文字
document.getElementById('tracks-container').addEventListener('click', (e) => {
  if (e.target.tagName === 'H2' && e.target.closest('.track, .trash')) {
    e.target.parentElement.classList.toggle('collapsed');
  }
});

// 更新顯示
function updateNowPlaying() {
  if (currentTrackIndex === -1) {
    nowPlayingEl.textContent = '尚未播放任何歌曲';
    nowPlayingFloatingEl.textContent = '尚未播放任何歌曲';
    nowPlayingFloatingEl.classList.remove('visible');
  } else {
    nowPlayingEl.textContent = `正在播放：${tracks[currentTrackIndex].title}`;
    nowPlayingFloatingEl.textContent = `正在播放：${tracks[currentTrackIndex].title}`;
    nowPlayingFloatingEl.classList.add('visible');
  }
}

function loadTrack(index) {
  currentTrackIndex = index;
  audioPlayer.src = tracks[index].audio;
  mainPlayBtn.textContent = '⏸';
  mainPlayBtn.classList.add('playing');
  mainPlayBtn.classList.remove('paused');
  updateNowPlaying();

  const trackSections = document.querySelectorAll('.track, .trash');
  if (trackSections[index]) {
    trackSections[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function playTrack() {
  audioPlayer.play().catch(() => alert('無法播放音樂檔案'));
  mainPlayBtn.textContent = '⏸';
  mainPlayBtn.classList.add('playing');
  mainPlayBtn.classList.remove('paused');
  updateNowPlaying();
}

function pauseTrack() {
  audioPlayer.pause();
  mainPlayBtn.textContent = '▶️';
  mainPlayBtn.classList.remove('playing');
  mainPlayBtn.classList.add('paused');
}

// 主播放按鈕
mainPlayBtn.addEventListener('click', () => {
  if (currentTrackIndex === -1 && tracks.length > 0) {
    loadTrack(0);
    playTrack();
  } else if (audioPlayer.paused) playTrack();
  else pauseTrack();
});

// 上一首 / 下一首
prevBtn.addEventListener('click', () => {
  if (tracks.length === 0) return;
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrackIndex);
  playTrack();
});

nextBtn.addEventListener('click', () => {
  if (tracks.length === 0) return;
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(currentTrackIndex);
  playTrack();
});

// 播放模式按鈕
function setPlayMode(mode) {
  playMode = mode;
  [loopAllBtn, loopOneBtn, shuffleBtn].forEach(btn => btn.classList.remove('active'));
  if (mode === 0) loopAllBtn.classList.add('active');
  else if (mode === 1) loopOneBtn.classList.add('active');
  else if (mode === 2) shuffleBtn.classList.add('active');
}

loopAllBtn.addEventListener('click', () => setPlayMode(0));
loopOneBtn.addEventListener('click', () => setPlayMode(1));
shuffleBtn.addEventListener('click', () => setPlayMode(2));

// 播放結束
audioPlayer.addEventListener('ended', () => {
  if (tracks.length === 0) return;
  if (playMode === 0) nextBtn.click();
  else if (playMode === 1) { audioPlayer.currentTime = 0; audioPlayer.play(); }
  else if (playMode === 2) {
    let randomIndex = currentTrackIndex;
    while(randomIndex === currentTrackIndex && tracks.length > 1){
      randomIndex = Math.floor(Math.random() * tracks.length);
    }
    loadTrack(randomIndex);
    playTrack();
  }
});

// 時間更新
audioPlayer.addEventListener('timeupdate', () => {
  if(audioPlayer.duration){
    let progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progressPercent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    durationEl.textContent = formatTime(audioPlayer.duration);
    saveState();
  }
});

// 進度條
progressBar.addEventListener('input', () => {
  if(audioPlayer.duration){
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
  }
});

// 音量
volumeBar.addEventListener('input', () => {
  audioPlayer.volume = volumeBar.value / 100;
});

// 格式化時間
function formatTime(seconds){
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 鍵盤控制
window.addEventListener('keydown', (e) => {
  if(e.target.tagName === 'INPUT') return;
  if(e.code === 'Space'){
    e.preventDefault();
    if(audioPlayer.paused) playTrack();
    else pauseTrack();
  } else if(e.code === 'ArrowRight'){
    nextBtn.click();
  } else if(e.code === 'ArrowLeft'){
    prevBtn.click();
  }
});

// 初始化
setPlayMode(0);
window.addEventListener('load', loadState);
