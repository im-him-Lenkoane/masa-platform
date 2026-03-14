// M@SA Custom Video Player
class MASAVideoPlayer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = options;
    this.transcriptVisible = false;
    this.currentTime = 0;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="masa-player" id="masa-player-wrap">
        <!-- Video Wrapper -->
        <div class="masa-video-wrap" style="position:relative;background:#000;border-radius:12px;overflow:hidden">
          
          <!-- Thumbnail -->
          <div class="masa-thumbnail" id="masa-thumb" style="position:relative;cursor:pointer" onclick="masaPlayer.play()">
            ${this.options.thumbnail 
              ? `<img src="${this.options.thumbnail}" style="width:100%;aspect-ratio:16/9;object-fit:cover">` 
              : `<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--bg-dark),var(--bg-card));display:flex;align-items:center;justify-content:center"><span style="font-size:4rem">🎬</span></div>`
            }
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
              <div style="width:72px;height:72px;background:rgba(0,200,150,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem">▶</div>
            </div>
          </div>

          <!-- Video Element (hidden until play) -->
          <div id="masa-video-container" style="display:none;position:relative">
            ${this.options.youtubeId 
              ? `<iframe id="masa-iframe" 
                  src="https://www.youtube.com/embed/${this.options.youtubeId}?enablejsapi=1&rel=0" 
                  style="width:100%;aspect-ratio:16/9;border:none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>`
              : `<video id="masa-video" 
                  src="${this.options.videoUrl || ''}" 
                  style="width:100%;aspect-ratio:16/9"
                  controls
                  ontimeupdate="masaPlayer.onTimeUpdate(this.currentTime)">
                </video>`
            }

            <!-- Transcript Overlay -->
            <div id="masa-transcript-overlay" style="
              display:none;
              position:absolute;
              bottom:0;left:0;right:0;
              height:15%;
              background:rgba(0,0,0,0.85);
              padding:8px 16px;
              overflow:hidden;
              border-top:1px solid rgba(255,255,255,0.1)
            ">
              <p id="masa-transcript-text" style="
                color:#fff;
                font-size:0.85rem;
                line-height:1.5;
                margin:0;
                text-align:center
              ">...</p>
            </div>
          </div>
        </div>

        <!-- Player Controls Bar -->
        <div style="display:flex;gap:8px;padding:12px 0;flex-wrap:wrap;align-items:center">
          <button id="masa-transcript-btn" 
            onclick="masaPlayer.toggleTranscript()" 
            class="btn btn-ghost btn-sm">
            📜 Transcript
          </button>
          <button onclick="masaPlayer.goToNotes()" class="btn btn-ghost btn-sm">📝 Notes</button>
          <button onclick="masaPlayer.goToQuiz()" class="btn btn-ghost btn-sm">❓ Quiz</button>
          <button onclick="masaPlayer.goToPractice()" class="btn btn-ghost btn-sm">📋 Practice</button>
          <button onclick="masaPlayer.askAI()" class="btn btn-ghost btn-sm">🤖 Ask AI</button>
          <button onclick="masaPlayer.bookmark()" class="btn btn-ghost btn-sm">🔖 Bookmark</button>
        </div>
      </div>
    `;
    this.loadTranscript();
  }

  play() {
    document.getElementById('masa-thumb').style.display = 'none';
    document.getElementById('masa-video-container').style.display = 'block';
    if (this.options.youtubeId) {
      // YouTube plays automatically when shown
    } else {
      const video = document.getElementById('masa-video');
      if (video) video.play();
    }
  }

  toggleTranscript() {
    this.transcriptVisible = !this.transcriptVisible;
    const overlay = document.getElementById('masa-transcript-overlay');
    const btn = document.getElementById('masa-transcript-btn');
    overlay.style.display = this.transcriptVisible ? 'block' : 'none';
    btn.style.background = this.transcriptVisible ? 'var(--primary)' : '';
    btn.style.color = this.transcriptVisible ? '#000' : '';
  }

  loadTranscript() {
    if (!this.options.transcript) return;
    this.transcript = typeof this.options.transcript === 'string' 
      ? JSON.parse(this.options.transcript) 
      : this.options.transcript;
  }

  onTimeUpdate(currentTime) {
    if (!this.transcript || !this.transcriptVisible) return;
    const current = this.transcript
      .filter(t => t.time <= currentTime)
      .pop();
    if (current) {
      const el = document.getElementById('masa-transcript-text');
      if (el) el.textContent = current.text;
    }
  }

  goToNotes() {
    document.querySelector('[data-placeholder="Notes"]')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToQuiz() {
    document.querySelector('[data-placeholder="Quiz"]')?.scrollIntoView({ behavior: 'smooth' });
  }

  goToPractice() {
    document.querySelector('[data-placeholder="Practice Questions"]')?.scrollIntoView({ behavior: 'smooth' });
  }

  askAI() {
    if (window.openAIChat) window.openAIChat();
    else alert('AI chat coming soon!');
  }

  bookmark() {
    alert('Bookmark saved! ✅');
  }
}

let masaPlayer = null;

function initMASAPlayer(containerId, options) {
  masaPlayer = new MASAVideoPlayer(containerId, options);
}