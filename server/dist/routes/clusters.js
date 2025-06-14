"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Cluster_1 = require("../models/Cluster");
const AppName_1 = require("../models/AppName");
const router = express_1.default.Router();
// Get all clusters
router.get('/', async (req, res) => {
    try {
        // Aggregate clusters with confirmation stats
        const clusters = await Cluster_1.Cluster.aggregate([
            {
                $lookup: {
                    from: 'appnames',
                    localField: '_id',
                    foreignField: 'cluster',
                    as: 'apps',
                },
            },
            {
                $addFields: {
                    totalApps: { $size: '$apps' },
                    confirmedApps: {
                        $size: {
                            $filter: {
                                input: '$apps',
                                as: 'app',
                                cond: { $eq: ['$$app.confirmed', true] },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    confirmationRatio: {
                        $cond: [
                            { $eq: ['$totalApps', 0] },
                            0,
                            { $divide: ['$confirmedApps', '$totalApps'] },
                        ],
                    },
                },
            },
            { $sort: { confirmationRatio: -1, name: 1 } },
        ]);
        // Optionally, populate createdBy (manual population since aggregate doesn't support populate)
        // You can do a separate query if needed, or leave as is for now.
        res.json(clusters);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create new cluster
router.post('/', [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('canonicalName').trim().notEmpty().withMessage('Canonical name is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, canonicalName, description } = req.body;
        const user = req.user;
        const cluster = new Cluster_1.Cluster({
            name,
            canonicalName,
            description,
            createdBy: user._id,
        });
        await cluster.save();
        res.status(201).json(cluster);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Update cluster
router.patch('/:id', [
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('canonicalName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Canonical name cannot be empty'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'canonicalName', 'description', 'status'];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates' });
        }
        const cluster = await Cluster_1.Cluster.findById(req.params.id);
        if (!cluster) {
            return res.status(404).json({ error: 'Cluster not found' });
        }
        updates.forEach((update) => {
            cluster[update] = req.body[update];
        });
        await cluster.save();
        res.json(cluster);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Get cluster stats
router.get('/:id/stats', async (req, res) => {
    try {
        const cluster = await Cluster_1.Cluster.findById(req.params.id);
        if (!cluster) {
            return res.status(404).json({ error: 'Cluster not found' });
        }
        const totalApps = await AppName_1.AppName.countDocuments({ cluster: cluster._id });
        const confirmedApps = await AppName_1.AppName.countDocuments({
            cluster: cluster._id,
            confirmed: true,
        });
        const unconfirmedApps = await AppName_1.AppName.countDocuments({
            cluster: cluster._id,
            confirmed: false,
        });
        res.json({
            totalApps,
            confirmedApps,
            unconfirmedApps,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
