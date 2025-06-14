"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const AppName_1 = require("../models/AppName");
const router = express_1.default.Router();
// Get all apps
router.get('/', async (req, res) => {
    try {
        const { confirmed } = req.query;
        console.log('Fetching apps with query:', { confirmed });
        const query = confirmed !== undefined ? { confirmed: confirmed === 'true' } : {};
        const apps = await AppName_1.AppName.find(query)
            .populate('cluster', 'name')
            .populate('createdBy', 'name')
            .populate('confirmedBy', 'name');
        console.log(`Found ${apps.length} apps`);
        res.json(apps);
    }
    catch (error) {
        console.error('Error fetching apps:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get unconfirmed apps
router.get('/unconfirmed', async (req, res) => {
    try {
        const apps = await AppName_1.AppName.find({ confirmed: false })
            .populate('cluster', 'name')
            .populate('createdBy', 'name');
        res.json(apps);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Get confirmed apps
router.get('/confirmed', async (req, res) => {
    try {
        const apps = await AppName_1.AppName.find({ confirmed: true })
            .populate('cluster', 'name')
            .populate('createdBy', 'name')
            .populate('confirmedBy', 'name');
        res.json(apps);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create new app
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('cluster').optional().isMongoId().withMessage('Invalid cluster ID'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, cluster, canonicalName } = req.body;
        const user = req.user;
        const app = new AppName_1.AppName({
            name,
            cluster,
            canonicalName,
            addedBy: user._id,
        });
        await app.save();
        res.status(201).json(app);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Update app
router.patch('/:id', [
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('cluster').optional().isMongoId().withMessage('Invalid cluster ID'),
    (0, express_validator_1.body)('notes').optional().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'cluster', 'notes'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }
        const app = await AppName_1.AppName.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        updates.forEach((update) => {
            app[update] = req.body[update];
        });
        await app.save();
        res.json(app);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Confirm app
router.patch('/:id/confirm', async (req, res) => {
    try {
        const app = await AppName_1.AppName.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ error: 'App not found' });
        }
        const user = req.user;
        app.confirmed = true;
        app.confirmedBy = user._id;
        // app.status = 'confirmed'; // Removed because 'status' does not exist on AppName
        await app.save();
        res.json(app);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
