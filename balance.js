const questions = [
    {
        id: 'q1',
        title: '평생 치킨만 먹기 vs 평생 피자만 먹기',
        a: '🍗 치킨만 먹기',
        b: '🍕 피자만 먹기'
    },
    {
        id: 'q2',
        title: '10년 후로 타임슬립 vs 10년 전으로 타임슬립',
        a: '🚀 10년 후로',
        b: '⏪ 10년 전으로'
    },
    {
        id: 'q3',
        title: '평생 여름만 있는 나라 vs 평생 겨울만 있는 나라',
        a: '☀️ 영원한 여름',
        b: '❄️ 영원한 겨울'
    },
    {
        id: 'q4',
        title: '말을 못하는 대신 하늘을 날 수 있다 vs 말은 하지만 평생 걷지 못한다',
        a: '🦅 날 수 있다',
        b: '🗣️ 말할 수 있다'
    },
    {
        id: 'q5',
        title: '친한 친구 10명 vs 평범한 친구 100명',
        a: '🤝 친한 친구 10명',
        b: '👥 평범한 친구 100명'
    }
];

let currentIndex = 0;
window.currentQuestionId = questions[0].id;

function getVotes(id) {
    const saved = localStorage.getItem('balance_' + id);
    return saved ? JSON.parse(saved) : { A: 0, B: 0 };
}

function saveVote(id, choice) {
    const votes = getVotes(id);
    votes[choice]++;
    localStorage.setItem('balance_' + id, JSON.stringify(votes));
}

function getMyVote(id) {
    return localStorage.getItem('myvote_' + id);
}

function saveMyVote(id, choice) {
    localStorage.setItem('myvote_' + id, choice);
}

function loadQuestion(index) {
    const q = questions[index];
    window.currentQuestionId = q.id;

    document.getElementById('question-number').textContent = index + 1;
    document.getElementById('question-title').textContent = q.title;
    document.getElementById('text-a').textContent = q.a;
    document.getElementById('text-b').textContent = q.b;
    document.getElementById('result-label-a').textContent = q.a;
    document.getElementById('result-label-b').textContent = q.b;

    const myVote = getMyVote(q.id);

    document.getElementById('result-section').style.display = 'none';
    document.getElementById('btn-a').classList.remove('selected', 'disabled');
    document.getElementById('btn-b').classList.remove('selected', 'disabled');
    document.getElementById('next-btn').style.display = index < questions.length - 1 ? 'block' : 'none';

    if (myVote) {
        showResult(q.id, myVote, false);
    }

    renderDots();
}

function vote(choice) {
    const q = questions[currentIndex];
    if (getMyVote(q.id)) return;

    saveVote(q.id, choice);
    saveMyVote(q.id, choice);
    showResult(q.id, choice, true);
}

function showResult(id, myChoice, animate) {
    const q = questions[currentIndex];
    const votes = getVotes(id);
    const total = votes.A + votes.B || 1;
    const pctA = Math.round((votes.A / total) * 100);
    const pctB = 100 - pctA;

    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    btnA.classList.add('disabled');
    btnB.classList.add('disabled');
    btnA.setAttribute('onclick', '');
    btnB.setAttribute('onclick', '');

    if (myChoice === 'A') btnA.classList.add('selected');
    else btnB.classList.add('selected');

    document.getElementById('result-section').style.display = 'block';
    document.getElementById('pct-a').textContent = pctA + '%';
    document.getElementById('pct-b').textContent = pctB + '%';

    if (animate) {
        setTimeout(() => {
            document.getElementById('bar-a').style.width = pctA + '%';
            document.getElementById('bar-b').style.width = pctB + '%';
        }, 50);
    } else {
        document.getElementById('bar-a').style.width = pctA + '%';
        document.getElementById('bar-b').style.width = pctB + '%';
    }

    const label = myChoice === 'A' ? q.a : q.b;
    document.getElementById('my-vote').textContent = `나의 선택: ${label}`;
    renderDots();
}

function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        // 버튼 클릭 이벤트 복원
        document.getElementById('btn-a').setAttribute('onclick', "vote('A')");
        document.getElementById('btn-b').setAttribute('onclick', "vote('B')");
        loadQuestion(currentIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderDots() {
    const container = document.getElementById('progress-dots');
    container.innerHTML = '';
    questions.forEach((q, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i === currentIndex) dot.classList.add('active');
        else if (getMyVote(q.id)) dot.classList.add('done');
        container.appendChild(dot);
    });
}

// 테마 토글
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// 초기화
loadQuestion(0);
