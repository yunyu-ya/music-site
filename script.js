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

let currentTrackIndex = -1;
let tracks = [];
let playMode = 0; // 0=循環全部, 1=單曲循環, 2=隨機播放

const STORAGE_KEY = 'musicPlayerState';

// 載入歌曲清單（此時 tracks-container 已有內容）
function initTracks() {
  const playButtons = document.querySelectorAll('.play-btn');
  playButtons.forEach((btn, index) => {
    const trackSection = btn.closest('.track');
    tracks.push({
      audio: trackSection.getAttribute('data-audio'),
      title: trackSection.querySelector('h2').textContent
    });

    btn.addEventListener('click', () => {
      if (currentTrackIndex === index) {
        if (audioPlayer.paused) {
          playTrack();
        } else {
          pauseTrack();
        }
      } else {
        loadTrack(index);
        playTrack();
      }
    });
  });
}

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
        audioPlayer.currentTime = obj.currentTime || 0;
        updateAllPlayButtons();
        updateNowPlaying();
      }
    } catch (e) { }
  }
}

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
  updateAllPlayButtons();
  mainPlayBtn.textContent = '⏸';
  mainPlayBtn.classList.add('playing');
  mainPlayBtn.classList.remove('paused');
  updateNowPlaying();

  const trackSections = document.querySelectorAll('.track');
  if (trackSections[index]) {
    trackSections[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function playTrack() {
  audioPlayer.play().catch(() => alert('無法播放音樂檔案'));
  updateAllPlayButtons(true);
  mainPlayBtn.textContent = '⏸';
  mainPlayBtn.classList.add('playing');
  mainPlayBtn.classList.remove('paused');
  updateNowPlaying();
}

function pauseTrack() {
  audioPlayer.pause();
  updateAllPlayButtons(false);
  mainPlayBtn.textContent = '▶️';
  mainPlayBtn.classList.remove('playing');
  mainPlayBtn.classList.add('paused');
}

// 更新所有播放按鈕狀態
function updatePlayBtn(button, isPlaying) {
  if (isPlaying) {
    button.textContent = '⏸ Pause';
    button.classList.add('playing');
  } else {
    button.textContent = '▶️ Play';
    button.classList.remove('playing');
  }
}

function updateAllPlayButtons(isPlaying = false) {
  const playButtons = document.querySelectorAll('.play-btn');
  playButtons.forEach((btn, idx) => {
    updatePlayBtn(btn, idx === currentTrackIndex && isPlaying);
  });
}

// 格式化時間 (秒 -> mm:ss)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 播放模式切換
function setPlayMode(mode) {
  playMode = mode;
  [loopAllBtn, loopOneBtn, shuffleBtn].forEach(btn => btn.classList.remove('active'));
  if (mode === 0) loopAllBtn.classList.add('active');
  else if (mode === 1) loopOneBtn.classList.add('active');
  else if (mode === 2) shuffleBtn.classList.add('active');
}

// 監聽事件
mainPlayBtn.addEventListener('click', () => {
  if (currentTrackIndex === -1 && tracks.length > 0) {
    loadTrack(0);
    playTrack();
  } else if (audioPlayer.paused) {
    playTrack();
  } else {
    pauseTrack();
  }
});

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

loopAllBtn.addEventListener('click', () => setPlayMode(0));
loopOneBtn.addEventListener('click', () => setPlayMode(1));
shuffleBtn.addEventListener('click', () => setPlayMode(2));

// 音樂播放結束事件
audioPlayer.addEventListener('ended', () => {
  if (tracks.length === 0) return;

  if (playMode === 0) { // 循環全部
    nextBtn.click();
  } else if (playMode === 1) { // 單曲循環
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else if (playMode === 2) { // 隨機播放
    let randomIndex = currentTrackIndex;
    while (randomIndex === currentTrackIndex && tracks.length > 1) {
      randomIndex = Math.floor(Math.random() * tracks.length);
    }
    loadTrack(randomIndex);
    playTrack();
  }
});

// 更新播放時間和進度條
audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = progressPercent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    durationEl.textContent = formatTime(audioPlayer.duration);
    saveState();
  }
});

// 進度條拖曳調整
progressBar.addEventListener('input', () => {
  if (audioPlayer.duration) {
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
  }
});

// 音量控制
volumeBar.addEventListener('input', () => {
  audioPlayer.volume = volumeBar.value / 100;
});

// 鍵盤快捷鍵
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (audioPlayer.paused) playTrack();
    else pauseTrack();
  } else if (e.code === 'ArrowRight') {
    nextBtn.click();
  } else if (e.code === 'ArrowLeft') {
    prevBtn.click();
  }
});

// 懸浮視窗位置動態更新
function updateFloatingPosition() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const floatingHeight = nowPlayingFloatingEl.offsetHeight;
  nowPlayingFloatingEl.style.top = `${scrollTop + windowHeight - floatingHeight - 20}px`;
}

window.addEventListener('scroll', updateFloatingPosition);
window.addEventListener('resize', updateFloatingPosition);

// 初始化播放模式
setPlayMode(0);

// 延遲初始化，因為歌曲列表是動態載入
window.addEventListener('load', () => {
  // 一定要在 DOM 和歌曲清單載入後呼叫這個
  initTracks();
  loadState();
  updateFloatingPosition();
});
      });
    });

    // 折疊/展開說明文字
    document.querySelectorAll('.track h2').forEach((h2, idx) => {
      h2.addEventListener('click', () => {
        const section = h2.parentElement;
        section.classList.toggle('collapsed');
      });
    });

    function updateNowPlaying(){
      if(currentTrackIndex === -1){
        nowPlayingEl.textContent = '尚未播放任何歌曲';
        nowPlayingFloatingEl.textContent = '尚未播放任何歌曲';
        nowPlayingFloatingEl.classList.remove('visible');
      } else {
        nowPlayingEl.textContent = `正在播放：${tracks[currentTrackIndex].title}`;
        nowPlayingFloatingEl.textContent = `正在播放：${tracks[currentTrackIndex].title}`;
        nowPlayingFloatingEl.classList.add('visible');
      }
    }

    function loadTrack(index){
      currentTrackIndex = index;
      audioPlayer.src = tracks[index].audio;
      updateAllPlayButtons();
      mainPlayBtn.textContent = '⏸';
      mainPlayBtn.classList.add('playing');
      mainPlayBtn.classList.remove('paused');
      updateNowPlaying();

      // 滾動目前播放歌曲區塊到視窗中央
      const trackSections = document.querySelectorAll('.track');
      if(trackSections[index]){
        trackSections[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function playTrack(){
      audioPlayer.play().catch(() => {
        alert('無法播放音樂檔案');
      });
      updateAllPlayButtons(true);
      mainPlayBtn.textContent = '⏸';
      mainPlayBtn.classList.add('playing');
      mainPlayBtn.classList.remove('paused');
      updateNowPlaying();
    }

    function pauseTrack(){
      audioPlayer.pause();
      updateAllPlayButtons(false);
      mainPlayBtn.textContent = '▶️';
      mainPlayBtn.classList.remove('playing');
      mainPlayBtn.classList.add('paused');
    }

    mainPlayBtn.addEventListener('click', () => {
      if(currentTrackIndex === -1 && tracks.length > 0){
        loadTrack(0);
        playTrack();
      } else if(audioPlayer.paused){
        playTrack();
      } else {
        pauseTrack();
      }
    });

    prevBtn.addEventListener('click', () => {
      if(tracks.length === 0) return;
      currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      loadTrack(currentTrackIndex);
      playTrack();
    });

    nextBtn.addEventListener('click', () => {
      if(tracks.length === 0) return;
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
      loadTrack(currentTrackIndex);
      playTrack();
    });

    // 播放模式按鈕互動
    function setPlayMode(mode){
      playMode = mode;
      [loopAllBtn, loopOneBtn, shuffleBtn].forEach(btn => btn.classList.remove('active'));
      if(mode === 0) loopAllBtn.classList.add('active');
      else if(mode === 1) loopOneBtn.classList.add('active');
      else if(mode === 2) shuffleBtn.classList.add('active');
    }

    loopAllBtn.addEventListener('click', () => setPlayMode(0));
    loopOneBtn.addEventListener('click', () => setPlayMode(1));
    shuffleBtn.addEventListener('click', () => setPlayMode(2));

    audioPlayer.addEventListener('ended', () => {
      if(tracks.length === 0) return;

      if(playMode === 0){ // 循環全部
        nextBtn.click();
      } else if(playMode === 1){ // 單曲循環
        audioPlayer.currentTime = 0;
        audioPlayer.play();
      } else if(playMode === 2){ // 隨機播放
        let randomIndex = currentTrackIndex;
        while(randomIndex === currentTrackIndex && tracks.length > 1){
          randomIndex = Math.floor(Math.random() * tracks.length);
        }
        loadTrack(randomIndex);
        playTrack();
      }
    });

    audioPlayer.addEventListener('timeupdate', () => {
      if(audioPlayer.duration){
        let progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progressPercent;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        durationEl.textContent = formatTime(audioPlayer.duration);
        saveState();
      }
    });

    progressBar.addEventListener('input', () => {
      if(audioPlayer.duration){
        let seekTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
      }
    });

    volumeBar.addEventListener('input', () => {
      audioPlayer.volume = volumeBar.value / 100;
    });

    function updatePlayBtn(button, isPlaying){
      if(isPlaying){
        button.textContent = '⏸ Pause';
        button.classList.add('playing');
      } else {
        button.textContent = '▶️ Play';
        button.classList.remove('playing');
      }
    }

    function updateAllPlayButtons(isPlaying){
      playButtons.forEach((btn, idx) => {
        updatePlayBtn(btn, idx === currentTrackIndex && isPlaying);
      });
    }

    function formatTime(seconds){
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // 鍵盤快捷鍵：空白鍵播放暫停，左右鍵切歌
    window.addEventListener('keydown', (e) => {
      if(e.target.tagName === 'INPUT') return; // 忽略輸入框
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

// 讓懸浮視窗跟隨捲動位置
function updateFloatingPosition() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const floatingHeight = nowPlayingFloatingEl.offsetHeight;
  // 固定在可視區底部 20px
  nowPlayingFloatingEl.style.top = `${scrollTop + windowHeight - floatingHeight - 20}px`;
}

// 監聽捲動與視窗大小變化
window.addEventListener('scroll', updateFloatingPosition);
window.addEventListener('resize', updateFloatingPosition);

// 初始化位置
updateFloatingPosition();


    // 初始化
    setPlayMode(0);
    // 延後載入以確保 tracks 陣列已填充
    window.addEventListener('load', () => {
      loadState();
    });
