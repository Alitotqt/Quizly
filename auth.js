const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const db = typeof firebase !== 'undefined' && typeof firebase.firestore !== 'undefined' ? firebase.firestore() : null;
let isSignUp = false;

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const submitText = document.getElementById('submit-text');
const switchText = document.getElementById('switch-text');
const toggleText = document.getElementById('toggle-text');
const toggleAuth = document.getElementById('toggle-auth');

const showError = (message) => {
    const existing = document.querySelector('.error-message');
    if (existing) existing.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #ef4444; text-align: center; margin-top: 1rem; padding: 0.5rem; background: #fee; border-radius: 0.5rem;';
    errorDiv.textContent = message;
    authForm?.insertAdjacentElement('afterend', errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
};

if (auth) {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = 'index.html';
    });
}

const generateToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};
const validateToken = (token) => sessionStorage.getItem('authToken') === token;

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = authForm.dataset.token;
        if (!validateToken(token)) {
            showError('Invalid request. Please refresh the page.');
            return;
        }
        
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }
        
        if (isSignUp && password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }
        
        if (!auth) {
            showError('Authentication service unavailable.');
            return;
        }
        
        try {
            if (isSignUp) {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (db && userCredential.user) {
                    await db.collection('users').doc(userCredential.user.uid).set({
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }
        } catch (error) {
            const msg = error.code === 'auth/invalid-email' ? 'Invalid email address.' :
                       error.code === 'auth/user-not-found' ? 'No account found with this email.' :
                       error.code === 'auth/wrong-password' ? 'Incorrect password.' :
                       error.code === 'auth/email-already-in-use' ? 'Email already registered.' :
                       error.message;
            showError(msg);
            const newToken = generateToken();
            sessionStorage.setItem('authToken', newToken);
            authForm.dataset.token = newToken;
        }
    });
    
    const token = generateToken();
    sessionStorage.setItem('authToken', token);
    authForm.dataset.token = token;
}

if (toggleAuth) {
    toggleAuth.addEventListener('click', () => {
        isSignUp = !isSignUp;
        
        if (isSignUp) {
            if (authTitle) authTitle.textContent = 'Create Account';
            if (authSubtitle) authSubtitle.textContent = 'Sign up to start learning';
            if (submitText) submitText.textContent = 'Sign Up';
            if (switchText) switchText.textContent = 'Already have an account?';
            if (toggleText) toggleText.textContent = 'Sign In';
        } else {
            if (authTitle) authTitle.textContent = 'Welcome Back';
            if (authSubtitle) authSubtitle.textContent = 'Sign in to continue learning';
            if (submitText) submitText.textContent = 'Sign In';
            if (switchText) switchText.textContent = "Don't have an account?";
            if (toggleText) toggleText.textContent = 'Sign Up';
        }
    });
}
