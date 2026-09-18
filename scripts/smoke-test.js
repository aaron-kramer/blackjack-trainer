const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SITE_DIR = path.join(__dirname, '..', 'docs');
const html = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'http://localhost/',
  virtualConsole: new (require('jsdom').VirtualConsole)(), // swallow noisy stub warnings
  beforeParse(win) {
    win.localStorage = (() => {
      let store = {};
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
      };
    })();
  },
});

const win = dom.window;
const doc = win.document;
const errors = [];
win.addEventListener('error', (e) => errors.push(e.error ? e.error.stack || e.message : e.message));

const scripts = ['js/strategy.js', 'js/lessons.js', 'js/storage.js', 'js/app.js'];
for (const rel of scripts) {
  const code = fs.readFileSync(path.join(SITE_DIR, rel), 'utf8');
  try {
    win.eval(code);
  } catch (e) {
    errors.push(`${rel}: ${e.stack || e.message}`);
  }
}

function check(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!cond) process.exitCode = 1;
}

const click = (el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const currentQuestion = () => {
  const s = win.__bjTrainerDebug.state;
  return s.questions[s.qIndex];
};

async function playLessonAlwaysCorrect() {
  let guard = 0;
  while (doc.getElementById('view-complete').classList.contains('hidden')) {
    guard++;
    if (guard > 200) return false;
    const q = currentQuestion();
    const btn = doc.querySelector(`#action-buttons .action-btn[data-code="${q.correctAction}"]`);
    click(btn);
    await sleep(950); // let the 900ms auto-advance timer fire
  }
  return true;
}

async function playLessonAlwaysWrong() {
  let guard = 0;
  while (doc.getElementById('view-failed').classList.contains('hidden')) {
    guard++;
    if (guard > 50) return false;
    const q = currentQuestion();
    const wrongBtn = Array.from(doc.querySelectorAll('#action-buttons .action-btn'))
      .find((b) => b.dataset.code !== q.correctAction);
    click(wrongBtn);
    await sleep(50);
    const cont = doc.getElementById('lesson-continue');
    if (!cont.classList.contains('hidden')) click(cont);
    await sleep(50);
  }
  return true;
}

async function main() {
  check('no script errors on load', errors.length === 0);
  if (errors.length) console.log(errors.join('\n---\n'));

  check('path view visible by default', !doc.getElementById('view-path').classList.contains('hidden'));
  check('lesson nodes rendered', doc.querySelectorAll('.lesson-node').length === 22);
  check('first lesson node is current (not locked)', doc.querySelector('.lesson-node').classList.contains('current'));
  check('later lessons start locked', doc.querySelectorAll('.lesson-node.locked').length > 0);

  click(doc.querySelector('.lesson-node'));
  check('intro overlay opens on unlocked lesson click', !doc.getElementById('overlay-intro').classList.contains('hidden'));

  click(doc.getElementById('intro-start'));
  check('lesson view visible after starting', !doc.getElementById('view-lesson').classList.contains('hidden'));
  check('dealer card rendered', doc.querySelectorAll('#dealer-cards .card').length === 2);
  check('player cards rendered', doc.querySelectorAll('#player-cards .card').length === 2);
  check('action buttons rendered', doc.querySelectorAll('#action-buttons .action-btn').length >= 2);

  const playedOk = await playLessonAlwaysCorrect();
  check('lesson flow (all-correct path) reaches complete screen', playedOk);
  check('no script errors after correct-path playthrough', errors.length === 0);
  if (errors.length) console.log(errors.join('\n---\n'));

  check('XP awarded for perfect lesson', win.__bjTrainerDebug.state.progress.xp > 0);
  check('lesson marked completed in progress', win.__bjTrainerDebug.state.progress.completedLessons.length === 1);

  click(doc.getElementById('complete-continue'));
  click(doc.querySelectorAll('.lesson-node')[1]); // now-unlocked second lesson
  check('second lesson node unlocked after completing first', !doc.getElementById('overlay-intro').classList.contains('hidden'));
  click(doc.getElementById('intro-start'));

  const failedOk = await playLessonAlwaysWrong();
  check('lesson flow (all-wrong path) reaches failed screen', failedOk);
  check('no script errors after wrong-path playthrough', errors.length === 0);
  if (errors.length) console.log(errors.join('\n---\n'));

  click(doc.getElementById('failed-retry'));
  check('retry from failed screen returns to lesson view', !doc.getElementById('view-lesson').classList.contains('hidden'));

  click(doc.getElementById('lesson-quit'));
  // confirm() in jsdom returns false by default without a stub, so quit should be a no-op
  win.confirm = () => true;
  click(doc.getElementById('lesson-quit'));
  check('quitting a lesson returns to the path view', !doc.getElementById('view-path').classList.contains('hidden'));

  click(doc.querySelector('.nav-btn[data-view="chart"]'));
  check('chart tables rendered', doc.querySelectorAll('table.chart-table').length === 3);
  check('chart shows all action colors in legend', doc.querySelectorAll('.legend-item').length === 5);

  click(doc.querySelector('.nav-btn[data-view="stats"]'));
  check('stats view shows lesson count', doc.getElementById('stats-lessons').textContent.includes('/'));

  win.confirm = () => true;
  click(doc.getElementById('stats-reset'));
  check('reset clears completed lessons', win.__bjTrainerDebug.state.progress.completedLessons.length === 0);

  console.log('DONE');
}

main();
