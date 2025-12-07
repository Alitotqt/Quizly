const auth = firebase.auth();
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

auth.onAuthStateChanged(user => {
    if (user) window.location.href = 'index.html';
});

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }
        
        try {
            if (isSignUp) {
                await auth.createUserWithEmailAndPassword(email, password);
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }
        } catch (error) {
            showError(error.message);
        }
    });
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
