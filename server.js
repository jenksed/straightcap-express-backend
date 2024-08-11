require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');

// Check for environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("Google Client ID and Secret must be set.");
  process.exit(1);
}

console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);

const app = express();

// Configure session middleware
app.use(cookieSession({
  name: 'google-auth-session',
  keys: ['key1', 'key2'], // Replace these with more secure keys, consider using environment variables
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3005/auth/google/callback" // Make sure this matches the one registered in Google Cloud Console
  },
  (accessToken, refreshToken, profile, done) => {
    // Here you would find or create a user in your database
    console.log("Authenticated user profile:", profile);
    done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize user by ID
});

passport.deserializeUser((user, done) => {
  done(null, user); // For simplicity, the whole user object is deserialized
});

// Google authentication route
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google authentication callback route
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// Logout route
app.get('/api/logout', (req, res) => {
  req.logout();
  res.clearCookie('google-auth-session');
  res.redirect('/');
});

// Home route
app.get('/', (req, res) => {
  res.send('Home Page. User: ' + (req.user ? req.user.displayName : "Not Logged In"));
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
