// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== Models ====================
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    purchasedCourses: { type: Array, default: [] }
});

const User = mongoose.model('User', userSchema);

// ==================== Routes ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Register:', req.body);
        const { name, email, password } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'البريد موجود بالفعل' });
        }
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: email === 'admin@admin.com' ? 'admin' : 'user'
        });
        
        await user.save();
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'تم التسجيل بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                purchasedCourses: []
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login:', req.body.email);
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'بيانات غير صحيحة' });
        }
        
        const bcrypt = require('bcryptjs');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'بيانات غير صحيحة' });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );
        
        res.json({
            message: 'تم تسجيل الدخول',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                purchasedCourses: user.purchasedCourses || []
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    try {
        const Course = mongoose.model('Course', new mongoose.Schema({
            title: String,
            description: String,
            level: String,
            price: Number,
            isPremium: Boolean,
            totalLessons: Number,
            image: String
        }));
        
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.json([]);
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==================== Database ====================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
