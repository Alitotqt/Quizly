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

auth.onAuthStateChanged(user => {
    if (user) window.location.href = 'index.html';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    try {
        if (isSignUp) {
            await auth.createUserWithEmailAndPassword(email, password);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        alert(error.message);
    }
});

toggleAuth.addEventListener('click', () => {
    isSignUp = !isSignUp;
    
    if (isSignUp) {
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to start learning';
        submitText.textContent = 'Sign Up';
        switchText.textContent = 'Already have an account?';
        toggleText.textContent = 'Sign In';
    } else {
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to continue learning';
        submitText.textContent = 'Sign In';
        switchText.textContent = "Don't have an account?";
        toggleText.textContent = 'Sign Up';
    }
});
