// =============================================================================
// SMOOSH! - fbconfig.js
// Firebase project config for the LIVE "smoosh" project (Phase B Task 7,
// happyirelim@gmail.com). Firestore db: asia-northeast3 (Seoul), production
// mode rules deployed from firebase/firestore.rules. Anonymous auth enabled.
// apiKey is a public client identifier (not a secret) - safe to ship in the
// client bundle; access is enforced entirely by the Firestore security rules.
// =============================================================================

const FB_CONFIG = {
    apiKey: "AIzaSyC5GA24ESWB97jOxN2bvt5nc_GgYrb5Tls",
    authDomain: "smoosh-83764.firebaseapp.com",
    projectId: "smoosh-83764",
    storageBucket: "smoosh-83764.firebasestorage.app",
    messagingSenderId: "836737744770",
    appId: "1:836737744770:web:99f33e307322db1599599b"
};

if (typeof module !== 'undefined') module.exports = { FB_CONFIG };
