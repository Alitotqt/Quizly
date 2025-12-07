const auth = firebase.auth();
const db = firebase.firestore();
let flashcards = [];
let shuffledCards = [];
let currentCard = 0;
let userAnswers = [];
let userId = null;

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'auth.html';
    } else {
        userId = user.uid;
        loadCards();
    }
});

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
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());

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
    
    if (question && answer) {
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
            alert('Failed to add card. Please try again.');
        });
    }
}

function updateCardList() {
    if (!cardList) return;
    cardList.innerHTML = flashcards.map((card, i) => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `
            <span class="card-number">${i + 1}</span>
            <div class="card-content-preview">
                <strong>Q:</strong> ${escapeHtml(card.question)}
            </div>
            <button class="delete-btn" data-id="${escapeHtml(card.id)}">×</button>
        `;
        div.querySelector('.delete-btn').addEventListener('click', () => deleteCard(card.id));
        return div.outerHTML;
    }).join('');
}

function deleteCard(id) {
    db.collection('flashcards').doc(id).delete().then(() => {
        loadCards();
    }).catch(err => {
        console.error('Error deleting card:', err);
        alert('Failed to delete card. Please try again.');
    });
}

function clearAllCards() {
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
        alert('Failed to clear cards. Please try again.');
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
        resultsList.innerHTML = userAnswers.map((answer, i) => `
            <div class="result-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-header">
                    <span class="result-number">${i + 1}</span>
                    <span class="result-status">${answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                </div>
                <div class="result-content">
                    <p><strong>Question:</strong> ${escapeHtml(answer.question)}</p>
                    <p><strong>Your Answer:</strong> ${escapeHtml(answer.userAnswer)}</p>
                    ${!answer.isCorrect ? `<p><strong>Correct Answer:</strong> ${escapeHtml(answer.correctAnswer)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
}

function loadCards() {
    if (!userId) return;
    db.collection('flashcards').where('userId', '==', userId).orderBy('createdAt').get().then(snapshot => {
        flashcards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCardList();
        if (startReviewBtn) startReviewBtn.disabled = flashcards.length === 0;
    }).catch(err => {
        console.error('Error loading cards:', err);
        if (cardList) cardList.innerHTML = '<p style="color: #ef4444; text-align: center;">Failed to load cards. Please refresh the page.</p>';
    });
}
