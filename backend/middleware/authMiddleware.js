const admin = require('firebase-admin');

const checkAuth = async (req, res, next) => {
    // Debug Logs
    console.log('[DEBUG] Middleware Hit: checkAuth');

    const sessionCookie = req.cookies.authToken || '';

    if (!sessionCookie) {
        console.log('[DEBUG] No authToken found. Redirecting to /login');
        return res.redirect('/login');
    }

    try {
        console.log('[DEBUG] Verifying token...');
        const decodedClaims = await admin.auth().verifyIdToken(sessionCookie);
        console.log('[DEBUG] Token verified for:', decodedClaims.email);

        const db = admin.firestore();
        const userRef = db.collection('users').doc(decodedClaims.uid);
        const userDoc = await userRef.get();

        let user;

        if (!userDoc.exists) {
            console.log('[DEBUG] User not found in Firestore. Creating new user...');
            user = {
                name: decodedClaims.name || 'Student',
                email: decodedClaims.email,
                uid: decodedClaims.uid,
                role: 'student', // Default
                createdAt: new Date().toISOString()
            };
            await userRef.set(user);
            console.log('[DEBUG] New user created:', user.email);
        } else {
            console.log('[DEBUG] User found in Firestore:', decodedClaims.email);
            user = userDoc.data();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[DEBUG] Auth Error:', error);
        res.clearCookie('authToken');
        res.redirect('/login');
    }
};

const checkAdmin = (req, res, next) => {
    console.log('[DEBUG] Middleware Hit: checkAdmin');
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.log('[DEBUG] Access Denied: User is not admin.');
        res.status(403).send('Access Denied: Admins Only');
    }
};

module.exports = { checkAuth, checkAdmin };
