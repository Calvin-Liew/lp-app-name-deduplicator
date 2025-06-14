"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password });
        const user = await User_1.User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
