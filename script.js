const audioPlayer = document.getElementById('audio-player');
const playButtons = document.querySelectorAll('.play-btn');
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

const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let currentTrackIndex = -1;
let tracks = [];
let playMode = 0; // 0=循環全部,1=單曲循環,2=隨機播放
const STORAGE_KEY = 'musicPlayerState';

// 音訊分析器
let audioContext, analyser, source, dataArray, bufferLength;

function initVisualizer() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    drawVisualizer();
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100}, 100, 200)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// 本地存儲
function saveState() {
    if(currentTrackIndex !== -1){
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            trackIndex: currentTrackIndex,
            currentTime: audioPlayer.currentTime
        }));
    }
}

function loadState() {
    const state = localStorage.getItem(STORAGE_KEY);
    if(state){
        try {
            const obj = JSON.parse(state);
            if(obj.trackIndex >=0 && obj.trackIndex < tracks.length){
                currentTrackIndex = obj.trackIndex;
                audioPlayer.src = tracks[currentTrackIndex].audio;
                updateAllPlayButtons();
                updateNowPlaying();
                audioPlayer.currentTime = obj.currentTime || 0;
            }
        } catch(e){}
    }
}

// 初始化播放清單
playButtons.forEach((btn, index) => {
    const trackSection = btn.closest('.track');
    tracks.push({
        audio: trackSection.getAttribute('data-audio'),
        title: trackSection.querySelector('h2').textContent
    });

    btn.addEventListener('click', () => {
        if(currentTrackIndex === index){
            if(audioPlayer.paused) playTrack();
            else pauseTrack();
        } else {
            loadTrack(index);
            playTrack();
        }
    });
});

// 折疊/展開文字
document.querySelectorAll('.track h2').forEach(h2 => {
    h2.addEventListener('click', () => {
        h2.parentElement.classList.toggle('collapsed');
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
    const trackSections = document.querySelectorAll('.track');
    if(trackSections[index]){
        trackSections[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function playTrack(){
    audioContext?.resume(); // 讓聲音分析器啟動
    audioPlayer.play().catch(() => alert('無法播放音樂檔案'));
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
    } else pauseTrack();
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

// 播放模式
function setPlayMode(mode){
    playMode = mode;
    [loopAllBtn, loopOneBtn, shuffleBtn].forEach(btn => btn.classList.remove('active'));
    if(mode===0) loopAllBtn.classList.add('active');
    else if(mode===1) loopOneBtn.classList.add('active');
    else shuffleBtn.classList.add('active');
}

loopAllBtn.addEventListener('click', ()=>setPlayMode(0));
loopOneBtn.addEventListener('click', ()=>setPlayMode(1));
shuffleBtn.addEventListener('click', ()=>setPlayMode(2));

audioPlayer.addEventListener('ended', () => {
    if(tracks.length === 0) return;
    if(playMode===0) nextBtn.click();
    else if(playMode===1){ audioPlayer.currentTime=0; audioPlayer.play(); }
    else {
        let randomIndex=currentTrackIndex;
        while(randomIndex===currentTrackIndex && tracks.length>1)
            randomIndex=Math.floor(Math.random()*tracks.length);
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
        audioPlayer.currentTime = (progressBar.value/100)*audioPlayer.duration;
    }
});

volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value/100;
});

// 更新按鈕
function updatePlayBtn(button, isPlaying){
    if(isPlaying){
        button.textContent='⏸ Pause';
        button.classList.add('playing');
    } else {
        button.textContent='▶️ Play';
        button.classList.remove('playing');
    }
}

function updateAllPlayButtons(isPlaying){
    playButtons.forEach((btn, idx)=>updatePlayBtn(btn, idx===currentTrackIndex && isPlaying));
}

function formatTime(seconds){
    const mins = Math.floor(seconds/60);
    const secs = Math.floor(seconds%60);
    return `${mins}:${secs<10?'0':''}${secs}`;
}

// 鍵盤快捷鍵
window.addEventListener('keydown', (e)=>{
    if(e.target.tagName==='INPUT') return;
    if(e.code==='Space'){ e.preventDefault(); if(audioPlayer.paused) playTrack(); else pauseTrack();}
    else if(e.code==='ArrowRight') nextBtn.click();
    else if(e.code==='ArrowLeft') prevBtn.click();
});

// 初始化
setPlayMode(0);
window.addEventListener('load', () => {
    loadState();
    initVisualizer();
});
