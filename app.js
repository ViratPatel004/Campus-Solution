const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const multer = require('multer');


dotenv.config();


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}
const db = admin.firestore();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const { checkAuth, checkAdmin } = require('./middleware/authMiddleware');

app.get('/', (req, res) => {
  // Pass user if it exists (for sticky auth state on landing)
  // This requires a soft check, but for now landing is public.
  // We'll rely on the dashboard for logout mainly, or strict checkAuth routes.
  res.render('landing', { title: 'CampusSolutions', user: undefined });
});

app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/student/login', (req, res) => {
  res.render('login', { title: 'Student Login' });
});

app.get('/admin/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login' });
});

app.get('/student/dashboard', checkAuth, async (req, res) => {
  try {
    const complaintsSnapshot = await db.collection('complaints')
      .where('studentId', '==', req.user.uid)
      .get();

    const complaints = [];
    complaintsSnapshot.forEach(doc => {
      complaints.push({ id: doc.id, ...doc.data() });
    });

    complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.render('student/dashboard', { title: 'Student Dashboard', user: req.user, complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.render('student/dashboard', { title: 'Student Dashboard', user: req.user, complaints: [] });
  }
});

app.get('/student/create-complaint', checkAuth, (req, res) => {
  res.render('student/create-complaint', { title: 'File Complaint', user: req.user });
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/student/create-complaint', checkAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, category, urgency, description } = req.body;
    let imageUrl = '';
    if (req.file) {
      try {
        const bucket = admin.storage().bucket();
        const filename = `complaints/${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(filename);

        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype }
        });

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
        });
        imageUrl = url;
      } catch (storageError) {
        console.error('Storage Upload Failed (Continuing without image):', storageError.message);
      }
    }

    await db.collection('complaints').add({
      studentId: req.user.uid,
      studentName: req.user.name,
      title,
      category,
      urgency,
      description,
      imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    console.log('Complaint Created:', title);
    res.redirect('/student/dashboard');

  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).send('Error submitting complaint');
  }
});


app.get('/make-me-admin', checkAuth, async (req, res) => {
  try {
    await db.collection('users').doc(req.user.uid).update({ role: 'admin' });
    res.send(`User ${req.user.email} is now an Admin! <a href="/admin/dashboard">Go to Dashboard</a>`);
  } catch (e) {
    res.status(500).send("Error promoting user: " + e.message);
  }
});

// --- SIGNUP & VERIFICATION ---
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Signup' });
});

app.post('/api/signup-complete', upload.single('idCard'), async (req, res) => {
  try {
    const { token, name } = req.body;

    // Verify Token to get UID
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    let idCardUrl = '';

    // Upload ID Card (With Error Handling)
    if (req.file) {
      try {
        const bucket = admin.storage().bucket();
        const filename = `id-cards/${uid}_${req.file.originalname}`;
        const file = bucket.file(filename);

        await file.save(req.file.buffer, {
          metadata: { contentType: req.file.mimetype }
        });

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
        });
        idCardUrl = url;
      } catch (storageErr) {
        console.error("ID Card Upload Failed:", storageErr.message);
        // Continue without ID card URL
      }
    }

    // Create User Doc
    await db.collection('users').doc(uid).set({
      uid,
      name,
      email,
      role: 'student',
      idCardUrl,
      isVerified: false, // Default to false
      createdAt: new Date().toISOString()
    });

    res.status(200).send("User created/updated");

  } catch (e) {
    console.error("Signup Error:", e);
    // Send actual error message for debugging
    res.status(500).send("Server Error: " + e.message);
  }
});

// Admin Route: Verify Student
app.post('/admin/verify-student', checkAuth, checkAdmin, async (req, res) => {
  try {
    const { userId, action } = req.body;

    const isVerified = action === 'approve';

    // Update verification status
    await db.collection('users').doc(userId).update({
      isVerified: isVerified
    });

    // Optionally: Send email? (Skipping for now)

    res.redirect('/admin/dashboard');
  } catch (e) {
    res.status(500).send("Error verifying user: " + e.message);
  }
});


// Protected admin routes - REAL DATA
app.get('/admin/dashboard', checkAuth, checkAdmin, async (req, res) => {
  try {
    // Fetch all ACTIVE complaints
    const complaintsSnapshot = await db.collection('complaints').get();
    let complaints = [];
    complaintsSnapshot.forEach(doc => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const activeComplaints = complaints.filter(c => c.status !== 'resolved');
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');

    // Fetch PENDING Verifications
    const usersSnapshot = await db.collection('users').where('isVerified', '==', false).get();
    let pendingUsers = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      // Only show students who actually have an ID card uploaded (incomplete signups might exist)
      if (data.idCardUrl) {
        pendingUsers.push(data);
      }
    });

    // Calculate Category Stats (Based on ALL active complaints, before filtering)
    const categoryStats = {};
    activeComplaints.forEach(c => {
      const cat = c.category || 'Uncategorized';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    // FILTER: If category query exists, filter the list displayed
    const selectedCategory = req.query.category || null;
    let displayedComplaints = activeComplaints;

    if (selectedCategory) {
      displayedComplaints = activeComplaints.filter(c => c.category === selectedCategory);
    }

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      complaints: displayedComplaints, // Show filtered list
      history: resolvedComplaints,
      pendingUsers: pendingUsers,
      stats: categoryStats, // Show stats for ALL active
      selectedCategory: selectedCategory // Pass selection to view
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { title: 'Admin Dashboard', user: req.user, complaints: [], history: [], pendingUsers: [] });
  }
});

// Admin Action: Resolve or Update Complaint
app.post('/admin/update-status', checkAuth, checkAdmin, async (req, res) => {
  try {
    const { complaintId, status } = req.body;

    await db.collection('complaints').doc(complaintId).update({
      status: status
    });

    res.redirect('/admin/dashboard');
  } catch (e) {
    res.status(500).send("Error updating status: " + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
