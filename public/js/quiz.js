// ================================================
// M@SA PLATFORM - QUIZ ENGINE
// public/js/quiz.js
// Handles MCQ, True/False, Matching
// ================================================

'use strict';

const QuizEngine = {
  quizId: null,
  questions: [],
  answers: {},   // { questionId: optionId }
  submitted: false,
  startTime: null,
  timerInterval: null,

  async load(quizId) {
    this.quizId = quizId;
    this.answers = {};
    this.submitted = false;
    this.startTime = Date.now();

    const container = document.getElementById('quiz-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      this.questions = await apiFetch(`/api/quizzes/${quizId}/questions`);
      this.render();
    } catch (err) {
      container.innerHTML = `<p style="color:var(--error);padding:20px">Failed to load quiz: ${escHtml(err.message)}</p>`;
    }
  },

  render() {
    const container = document.getElementById('quiz-container');
    if (!container || !this.questions.length) {
      if (container) container.innerHTML = '<p style="color:var(--grey-light);padding:20px">No questions available yet.</p>';
      return;
    }

    let html = '<div class="quiz-container">';
    html += `<p style="color:var(--grey-light);font-size:0.78rem;margin-bottom:20px;font-family:var(--font-mono)">${this.questions.length} question${this.questions.length !== 1 ? 's' : ''}</p>`;

    this.questions.forEach((q, idx) => {
      html += `<div class="quiz-question" data-qid="${escHtml(q.id)}">`;
      html += `<div class="quiz-question-text"><span style="color:var(--gold);font-family:var(--font-mono)">Q${idx + 1}.</span> ${escHtml(q.question_text)}</div>`;

      if (q.image_url) {
        html += `<img src="${escHtml(q.image_url)}" alt="Question diagram" style="max-width:100%;border-radius:var(--radius);margin-bottom:12px">`;
      }

      if (q.type === 'matching') {
        html += this.renderMatching(q);
      } else {
        // MCQ and True/False use radio buttons
        html += '<div class="quiz-options">';
        q.options.forEach(opt => {
          html += `
            <label class="quiz-option" data-oid="${escHtml(opt.id)}">
              <input type="radio" name="q_${escHtml(q.id)}" value="${escHtml(opt.id)}" 
                     onchange="QuizEngine.selectAnswer('${escHtml(q.id)}', '${escHtml(opt.id)}', this)">
              <span>${escHtml(opt.option_text)}</span>
            </label>`;
        });
        html += '</div>';
      }
      html += '</div>';
    });

    html += `
      <div style="text-align:center;margin-top:28px">
        <button class="btn btn-primary" onclick="QuizEngine.submit()">Submit Answers →</button>
      </div>
    </div>`;

    container.innerHTML = html;
  },

  renderMatching(q) {
    // Split into left (terms) and right (definitions) based on sort_order
    const terms = q.options.filter((_, i) => i % 2 === 0);
    const defs  = q.options.filter((_, i) => i % 2 === 1);
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">';
    html += '<div>';
    terms.forEach((t, i) => {
      html += `<div style="background:var(--navy);border:1px solid rgba(79,195,247,0.2);border-radius:var(--radius);padding:8px 12px;margin-bottom:6px;font-size:0.82rem">${String.fromCharCode(65 + i)}. ${escHtml(t.option_text)}</div>`;
    });
    html += '</div><div>';
    defs.forEach((d, i) => {
      html += `
        <div style="margin-bottom:6px">
          <select class="matching-select" onchange="QuizEngine.selectMatch('${escHtml(q.id)}', ${i}, this.value)"
                  style="width:100%;background:var(--navy-mid);border:1px solid rgba(79,195,247,0.2);border-radius:var(--radius);color:var(--white);padding:8px;font-size:0.8rem">
            <option value="">Match for: ${escHtml(d.option_text)}</option>
            ${terms.map((t, j) => `<option value="${escHtml(t.id)}">${String.fromCharCode(65+j)}</option>`).join('')}
          </select>
        </div>`;
    });
    html += '</div></div>';
    return html;
  },

  selectAnswer(questionId, optionId, radioEl) {
    this.answers[questionId] = optionId;
    // Visual feedback
    const container = radioEl.closest('.quiz-options');
    if (container) {
      container.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
      radioEl.closest('.quiz-option').classList.add('selected');
    }
  },

  selectMatch(questionId, defIndex, termId) {
    if (!this.answers[questionId]) this.answers[questionId] = {};
    this.answers[questionId][defIndex] = termId;
  },

  async submit() {
    const unanswered = this.questions.filter(q => {
      if (q.type === 'matching') return !this.answers[q.id];
      return !this.answers[q.id];
    });

    if (unanswered.length > 0) {
      showToast(`Please answer all ${unanswered.length} remaining question(s) first.`, 'error');
      return;
    }

    this.submitted = true;
    const container = document.getElementById('quiz-container');
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
      const result = await apiFetch(`/api/quizzes/${this.quizId}/submit`, {
        method: 'POST',
        body: { answers: this.answers },
      });

      this.showResults(result);
    } catch (err) {
      showToast('Submission failed: ' + err.message, 'error');
      this.submitted = false;
      this.render();
    }
  },

  showResults(result) {
    const container = document.getElementById('quiz-container');
    const color = result.passed ? 'var(--success)' : 'var(--error)';
    const emoji = result.passed ? '🎉' : '📚';

    let html = `
      <div class="quiz-results">
        <div style="font-size:3rem;margin-bottom:12px">${emoji}</div>
        <div class="quiz-score" style="color:${color}">${result.percentage}%</div>
        <div class="quiz-score-label">${result.correct} / ${result.total} correct</div>
        <div style="margin:16px 0;padding:12px;background:${result.passed?'rgba(76,175,80,0.1)':'rgba(244,67,54,0.1)'};border:1px solid ${color};border-radius:var(--radius)">
          <strong style="color:${color}">${result.passed ? '✓ Passed!' : '✗ Not quite — keep studying!'}</strong>
        </div>
      </div>
      <div style="padding:0 20px 20px">
        <p style="font-family:var(--font-mono);font-size:0.65rem;color:var(--grey-light);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.1em">Answer Review</p>`;

    this.questions.forEach((q, idx) => {
      const r = result.results.find(x => x.questionId === q.id);
      if (!r) return;
      const isCorrect = r.correct;
      html += `
        <div style="background:var(--navy);border:1px solid ${isCorrect?'rgba(76,175,80,0.3)':'rgba(244,67,54,0.3)'};border-radius:var(--radius);padding:12px;margin-bottom:8px">
          <div style="font-size:0.85rem;color:var(--white);margin-bottom:6px">
            <span style="color:var(--gold);font-family:var(--font-mono)">Q${idx+1}.</span> ${escHtml(q.question_text)}
          </div>
          <div style="font-size:0.78rem;color:${isCorrect?'var(--success)':'var(--error)'}">
            ${isCorrect ? '✓ Correct' : '✗ Incorrect'} 
            ${!isCorrect && r.correctOptionText ? `— Answer: <strong>${escHtml(r.correctOptionText)}</strong>` : ''}
          </div>
        </div>`;
    });

    html += `
      </div>
      <div style="text-align:center;padding:0 20px 24px">
        <button class="btn btn-ghost" onclick="QuizEngine.load('${this.quizId}')">Try Again</button>
      </div>`;

    container.innerHTML = html;
  },
};
