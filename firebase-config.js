const firebaseConfig = {
  apiKey: "AIzaSyAL1KwfSwbPngKGrkJwxjhXj5zORoyZ2RY",
  authDomain: "quizly-7ea0b.firebaseapp.com",
  projectId: "quizly-7ea0b",
  storageBucket: "quizly-7ea0b.firebasestorage.app",
  messagingSenderId: "985207245946",
  appId: "1:985207245946:web:25b0f0e838074437acbfc3",
  measurementId: "G-JSPBX1Y51B"
};

let db = null;

if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.error('Firebase SDK not loaded');
}