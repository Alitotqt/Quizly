const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' && typeof firebase.firestore !== 'undefined' ? firebase.firestore() : null;
let flashcards = [];
let shuffledCards = [];
let currentCard = 0;
let userAnswers = [];
let userId = null;

if (auth) {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'auth.html';
        } else {
            userId = user.uid;
            loadCards();
        }
    });
}

const addPage = document.getElementById('add-page');
const reviewPage = document.getElementById('review-page');
const resultsPage = document.getElementById('results-page');
const questionInput = document.getElementById('question-input');
const answerInput = document.getElementById('answer-input');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const startReviewBtn = document.getElementById('start-review-btn');
const cardList = document.getElementById('card-list');
const questionText = document.getElementById('question-text');
const userAnswerInput = document.getElementById('user-answer');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const counter = document.getElementById('card-counter');
const scoreText = document.getElementById('score-text');
const scoreMessage = document.getElementById('score-message');
const resultsList = document.getElementById('results-list');
const retryBtn = document.getElementById('retry-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const clearModal = document.getElementById('clear-modal');
const cancelClear = document.getElementById('cancel-clear');
const confirmClear = document.getElementById('confirm-clear');
const logoutBtn = document.getElementById('logout-btn');

const showError = (message) => {
    const existing = document.querySelector('.error-message');
    if (existing) existing.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #ef4444; text-align: center; margin: 1rem; padding: 0.75rem; background: #fee; border-radius: 0.5rem;';
    errorDiv.textContent = message;
    const target = document.querySelector('.active') || addPage;
    target?.insertBefore(errorDiv, target.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
};

if (addBtn) addBtn.addEventListener('click', addCard);
if (clearBtn) clearBtn.addEventListener('click', () => clearModal?.classList.add('active'));
if (cancelClear) cancelClear.addEventListener('click', () => clearModal?.classList.remove('active'));
if (confirmClear) confirmClear.addEventListener('click', clearAllCards);
if (startReviewBtn) startReviewBtn.addEventListener('click', startReview);
if (submitAnswerBtn) submitAnswerBtn.addEventListener('click', submitAnswer);
if (retryBtn) retryBtn.addEventListener('click', startReview);
if (backHomeBtn) backHomeBtn.addEventListener('click', () => showPage('add'));
if (questionInput) questionInput.addEventListener('keypress', (e) => e.key === 'Enter' && answerInput?.focus());
if (answerInput) answerInput.addEventListener('keypress', (e) => e.key === 'Enter' && addCard());
if (userAnswerInput) userAnswerInput.addEventListener('keypress', (e) => e.key === 'Enter' && submitAnswer());
if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (auth) {
        auth.signOut().then(() => {
            window.location.href = 'auth.html';
        }).catch(err => {
            console.error('Logout error:', err);
            showError('Failed to logout. Please try again.');
        });
    }
});

function showPage(page) {
    addPage.classList.remove('active');
    reviewPage.classList.remove('active');
    resultsPage.classList.remove('active');
    
    if (page === 'add') addPage.classList.add('active');
    else if (page === 'review') reviewPage.classList.add('active');
    else if (page === 'results') resultsPage.classList.add('active');
}

function addCard() {
    const question = questionInput?.value.trim();
    const answer = answerInput?.value.trim();
    
    if (!question || !answer) return;
    
    if (question.length > 500 || answer.length > 500) {
        showError('Question and answer must be under 500 characters.');
        return;
    }
    
    if (!db) {
        showError('Database not available. Please check Firebase setup.');
        return;
    }
    
    db.collection('flashcards').add({
        userId,
        question,
        answer,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        if (questionInput) questionInput.value = '';
        if (answerInput) answerInput.value = '';
        questionInput?.focus();
        loadCards();
    }).catch(err => {
        console.error('Error adding card:', err);
        showError('Failed to add card: ' + err.message);
    });
}

function updateCardList() {
    if (!cardList) return;
    cardList.innerHTML = '';
    flashcards.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = 'card-item';
        
        const num = document.createElement('span');
        num.className = 'card-number';
        num.textContent = i + 1;
        
        const content = document.createElement('div');
        content.className = 'card-content-preview';
        const strong = document.createElement('strong');
        strong.textContent = 'Q: ';
        content.appendChild(strong);
        content.appendChild(document.createTextNode(card.question));
        
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        btn.textContent = '×';
        btn.addEventListener('click', () => deleteCard(card.id));
        
        div.appendChild(num);
        div.appendChild(content);
        div.appendChild(btn);
        cardList.appendChild(div);
    });
}

function deleteCard(id) {
    if (!db) return;
    db.collection('flashcards').doc(id).delete().then(() => {
        loadCards();
    }).catch(err => {
        console.error('Error deleting card:', err);
        showError('Failed to delete card. Please try again.');
    });
}

function clearAllCards() {
    if (!db) return;
    db.collection('flashcards').where('userId', '==', userId).get().then(snapshot => {
        const batch = db.batch();
        const maxDocs = Math.min(snapshot.docs.length, 500);
        for (let i = 0; i < maxDocs; i++) {
            batch.delete(snapshot.docs[i].ref);
        }
        return batch.commit();
    }).then(() => {
        loadCards();
        clearModal?.classList.remove('active');
    }).catch(err => {
        console.error('Error clearing cards:', err);
        showError('Failed to clear cards. Please try again.');
    });
}

function startReview() {
    currentCard = 0;
    userAnswers = [];
    shuffledCards = [...flashcards];
    for (let i = shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }
    showPage('review');
    showQuestion();
}

function showQuestion() {
    if (questionText) questionText.textContent = shuffledCards[currentCard].question;
    if (userAnswerInput) {
        userAnswerInput.value = '';
        userAnswerInput.focus();
    }
    if (counter) counter.textContent = `${currentCard + 1} / ${shuffledCards.length}`;
    const progress = ((currentCard + 1) / shuffledCards.length) * 100;
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) progressFill.style.width = progress + '%';
}

function submitAnswer() {
    const userAnswer = userAnswerInput?.value.trim();
    if (!userAnswer) return;
    
    userAnswers.push({
        question: shuffledCards[currentCard].question,
        correctAnswer: shuffledCards[currentCard].answer,
        userAnswer: userAnswer,
        isCorrect: userAnswer.toLowerCase() === shuffledCards[currentCard].answer.trim().toLowerCase()
    });
    
    currentCard++;
    
    if (currentCard < shuffledCards.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showPage('results');
    
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const percentage = userAnswers.length > 0 ? Math.round((correctCount / userAnswers.length) * 100) : 0;
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    
    if (percentage === 100) {
        resultTitle.innerHTML = '<i class="bi bi-trophy-fill"></i> Perfect Score!';
        resultMessage.textContent = 'Outstanding! You got everything right!';
    } else if (percentage >= 80) {
        resultTitle.innerHTML = '<i class="bi bi-star-fill"></i> Excellent Work!';
        resultMessage.textContent = 'Great job! You\'re doing amazing!';
    } else if (percentage >= 60) {
        resultTitle.innerHTML = '<i class="bi bi-hand-thumbs-up-fill"></i> Good Effort!';
        resultMessage.textContent = 'Nice work! Keep practicing to improve!';
    } else if (percentage >= 40) {
        resultTitle.innerHTML = '<i class="bi bi-lightning-fill"></i> Keep Going!';
        resultMessage.textContent = 'You\'re making progress. Try again!';
    } else {
        resultTitle.innerHTML = '<i class="bi bi-book-fill"></i> Keep Learning!';
        resultMessage.textContent = 'Don\'t give up! Practice makes perfect!';
    }
    
    if (scoreText) scoreText.textContent = `${percentage}%`;
    if (scoreMessage) scoreMessage.textContent = `${correctCount} / ${userAnswers.length}`;
    
    const CIRCLE_RADIUS = 80;
    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    const scoreProgress = document.getElementById('score-progress');
    if (scoreProgress) scoreProgress.style.strokeDashoffset = offset;
    
    if (resultsList) {
        resultsList.innerHTML = '';
        userAnswers.forEach((answer, i) => {
            const item = document.createElement('div');
            item.className = `result-item ${answer.isCorrect ? 'correct' : 'incorrect'}`;
            
            const header = document.createElement('div');
            header.className = 'result-header';
            const num = document.createElement('span');
            num.className = 'result-number';
            num.textContent = i + 1;
            const status = document.createElement('span');
            status.className = 'result-status';
            status.textContent = answer.isCorrect ? '✓ Correct' : '✗ Incorrect';
            header.appendChild(num);
            header.appendChild(status);
            
            const content = document.createElement('div');
            content.className = 'result-content';
            
            const q = document.createElement('p');
            const qStrong = document.createElement('strong');
            qStrong.textContent = 'Question: ';
            q.appendChild(qStrong);
            q.appendChild(document.createTextNode(answer.question));
            
            const a = document.createElement('p');
            const aStrong = document.createElement('strong');
            aStrong.textContent = 'Your Answer: ';
            a.appendChild(aStrong);
            a.appendChild(document.createTextNode(answer.userAnswer));
            
            content.appendChild(q);
            content.appendChild(a);
            
            if (!answer.isCorrect) {
                const c = document.createElement('p');
                const cStrong = document.createElement('strong');
                cStrong.textContent = 'Correct Answer: ';
                c.appendChild(cStrong);
                c.appendChild(document.createTextNode(answer.correctAnswer));
                content.appendChild(c);
            }
            
            item.appendChild(header);
            item.appendChild(content);
            resultsList.appendChild(item);
        });
    }
}

function loadCards() {
    if (!db || !userId) {
        console.log('DB or userId not available:', { db: !!db, userId });
        return;
    }
    db.collection('flashcards').where('userId', '==', userId).orderBy('createdAt').get().then(snapshot => {
        flashcards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCardList();
        if (startReviewBtn) startReviewBtn.disabled = flashcards.length === 0;
    }).catch(err => {
        console.error('Error loading cards:', err);
        if (err.code === 'failed-precondition' || err.message.includes('index')) {
            showError('Setting up database. Please wait a moment and refresh.');
        } else {
            showError('Failed to load cards: ' + err.message);
        }
    });
}
