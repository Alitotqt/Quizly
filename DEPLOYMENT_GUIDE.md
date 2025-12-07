# Quizly Deployment Guide

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click "Add app" → Web (</> icon)
4. Register your app and copy the config object
5. Go to Firestore Database → Create Database → Start in production mode
6. Update `firebase-config.js` with your credentials

## Firestore Security Rules

In Firebase Console → Firestore Database → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /flashcards/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Deploy to Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: quizly
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Click "Create Web Service"

Your app will be live at: `https://your-app-name.onrender.com`
