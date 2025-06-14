"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register user
router.post('/register', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password } = req.body;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Create new user
        const user = new User_1.User({
            name,
            email,
            password,
        });
        await user.save();
        // Generate token
        const token = await user.generateAuthToken();
        res.status(201).json({ user, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Login user
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // Find user by email
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = await user.generateAuthToken();
        res.json({ user, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Get current user
router.get('/me', auth_1.auth, async (req, res) => {
    try {
        res.json(req.user);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Logout user
router.post('/logout', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = user.tokens.filter((token) => token.token !== req.token);
        await user.save();
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
