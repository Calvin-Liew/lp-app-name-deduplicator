"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./middleware/auth");
const users_1 = __importDefault(require("./routes/users"));
const apps_1 = __importDefault(require("./routes/apps"));
const clusters_1 = __importDefault(require("./routes/clusters"));
const admin_1 = __importDefault(require("./routes/admin"));
const AppName_1 = require("./models/AppName");
const Cluster_1 = require("./models/Cluster");
const User_1 = require("./models/User");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use((0, helmet_1.default)());
// Routes
app.use('/api/users', users_1.default);
app.use('/api/apps', auth_1.auth, apps_1.default);
app.use('/api/clusters', auth_1.auth, clusters_1.default);
app.use('/api/admin', auth_1.auth, admin_1.default);
// Stats endpoint for dashboard
app.get('/api/stats', auth_1.auth, async (req, res) => {
    var _a, _b, _c;
    try {
        console.log('Fetching stats for user:', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const totalApps = await AppName_1.AppName.countDocuments();
        const confirmedApps = await AppName_1.AppName.countDocuments({ confirmed: true });
        const unconfirmedApps = await AppName_1.AppName.countDocuments({ confirmed: false });
        const totalClusters = await Cluster_1.Cluster.countDocuments();
        // Get user's streak
        const user = await User_1.User.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActivity = (user === null || user === void 0 ? void 0 : user.lastActivity) ? new Date(user.lastActivity) : null;
        const streak = lastActivity && lastActivity >= today ? ((user === null || user === void 0 ? void 0 : user.streak) || 0) : 0;
        // Calculate XP and level
        const xp = (user === null || user === void 0 ? void 0 : user.xp) || 0;
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;
        console.log('Stats endpoint user:', (_c = req.user) === null || _c === void 0 ? void 0 : _c.id, 'xp:', xp, 'level:', level, 'streak:', streak);
        // Get team statistics
        const totalUsers = await User_1.User.countDocuments();
        const activeUsers = await User_1.User.countDocuments({ lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
        const averageConfirmations = totalUsers > 0 ? confirmedApps / totalUsers : 0;
        const completionRate = totalApps > 0 ? confirmedApps / totalApps : 0;
        // Get recent activity
        const recentActivity = await AppName_1.AppName.find({ confirmed: true })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('confirmedBy', 'name')
            .then(apps => apps.map(app => {
            var _a, _b;
            return ({
                userId: ((_a = app.confirmedBy) === null || _a === void 0 ? void 0 : _a._id) || '',
                userName: ((_b = app.confirmedBy) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown User',
                action: 'confirmed',
                timestamp: app.updatedAt,
                details: `"${app.name}"`
            });
        }));
        // Team achievements
        const teamAchievements = [
            {
                id: 'first_100',
                name: 'First 100',
                description: 'Team confirms 100 app names',
                icon: '🎯',
                unlocked: confirmedApps >= 100,
                progress: confirmedApps,
                total: 100,
                unlockedAt: confirmedApps >= 100 ? new Date().toISOString() : undefined,
                unlockedBy: confirmedApps >= 100 ? 'Team' : undefined
            },
            {
                id: 'halfway_there',
                name: 'Halfway There',
                description: 'Team confirms 50% of all apps',
                icon: '🏆',
                unlocked: completionRate >= 0.5,
                progress: Math.round(completionRate * 100),
                total: 50,
                unlockedAt: completionRate >= 0.5 ? new Date().toISOString() : undefined,
                unlockedBy: completionRate >= 0.5 ? 'Team' : undefined
            },
            {
                id: 'team_effort',
                name: 'Team Effort',
                description: '10 team members contribute',
                icon: '👥',
                unlocked: activeUsers >= 10,
                progress: activeUsers,
                total: 10,
                unlockedAt: activeUsers >= 10 ? new Date().toISOString() : undefined,
                unlockedBy: activeUsers >= 10 ? 'Team' : undefined
            },
            {
                id: 'cluster_masters',
                name: 'Cluster Masters',
                description: 'Complete 20 clusters',
                icon: '🔍',
                unlocked: totalClusters >= 20,
                progress: totalClusters,
                total: 20,
                unlockedAt: totalClusters >= 20 ? new Date().toISOString() : undefined,
                unlockedBy: totalClusters >= 20 ? 'Team' : undefined
            },
            {
                id: 'speed_demons',
                name: 'Speed Demons',
                description: 'Confirm 50 apps in one day',
                icon: '⚡',
                unlocked: false, // This would need to be calculated based on daily activity
                progress: 0,
                total: 50,
                unlockedAt: undefined,
                unlockedBy: undefined
            },
            {
                id: 'perfection',
                name: 'Perfection',
                description: 'Complete all app confirmations',
                icon: '🌟',
                unlocked: unconfirmedApps === 0,
                progress: confirmedApps,
                total: totalApps,
                unlockedAt: unconfirmedApps === 0 ? new Date().toISOString() : undefined,
                unlockedBy: unconfirmedApps === 0 ? 'Team' : undefined
            }
        ];
        const stats = {
            totalApps,
            confirmedApps,
            unconfirmedApps,
            totalClusters,
            pendingReviews: unconfirmedApps,
            streak,
            xp,
            level,
            teamStats: {
                totalConfirmed: confirmedApps,
                totalUsers,
                activeUsers,
                averageConfirmations,
                completionRate,
                teamAchievements,
                recentActivity
            }
        };
        console.log('Stats:', stats);
        res.json(stats);
    }
    catch (e) {
        console.error('Error fetching stats:', e);
        res.status(500).send(e);
    }
});
// Routes
app.use('/api', auth_1.auth, admin_1.default);
// Add a test route to confirm the correct backend is running
app.get('/api/test', (req, res) => {
    res.send('Test route is working');
});
// Leaderboard endpoint
app.get('/api/leaderboard', auth_1.auth, async (req, res) => {
    try {
        const leaderboard = await AppName_1.AppName.aggregate([
            { $match: { confirmed: true, confirmedBy: { $ne: null } } },
            { $group: { _id: '$confirmedBy', count: { $sum: 1 } } },
            { $match: { count: { $gt: 0 } } },
            { $sort: { count: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            { $project: { _id: 0, userId: '$user._id', name: '$user.name', email: '$user.email', count: 1 } },
        ]);
        res.json(leaderboard);
    }
    catch (e) {
        res.status(500).send(e);
    }
});
// Update user activity and award XP
app.post('/api/apps/:id/confirm', auth_1.auth, async (req, res) => {
    var _a, _b, _c;
    try {
        let app = await AppName_1.AppName.findById(req.params.id).populate('cluster', 'name');
        if (!app) {
            return res.status(404).send('App not found');
        }
        app.confirmed = true;
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) {
            app.confirmedBy = new mongoose_1.default.Types.ObjectId(req.user.id);
        }
        await app.save();
        // Re-populate after save in case cluster was not populated before
        app = await AppName_1.AppName.findById(app._id).populate('cluster', 'name');
        // Update user's streak and XP
        const user = await User_1.User.findById((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        let xp = 0, level = 1, streak = 0;
        if (user) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
            // Update streak
            if (!lastActivity || lastActivity < today) {
                user.streak = 1;
            }
            else {
                user.streak = (user.streak || 0) + 1;
            }
            // Award XP
            user.xp = (user.xp || 0) + 100; // Base XP for confirmation
            user.lastActivity = new Date();
            await user.save();
            xp = user.xp;
            level = Math.floor(Math.sqrt(xp / 100)) + 1;
            streak = user.streak || 0;
            console.log('Confirmed app for user:', user._id, 'xp:', xp, 'level:', level, 'streak:', streak);
        }
        else {
            console.log('No user found for confirmation:', (_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
        }
        let clusterInfo = null;
        if (app && app.cluster && typeof app.cluster === 'object' && 'name' in app.cluster) {
            clusterInfo = { id: app.cluster._id, name: app.cluster.name };
        }
        res.json({
            app,
            user: { xp, level, streak },
            cluster: clusterInfo
        });
    }
    catch (e) {
        res.status(500).send(e);
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
// Connect to MongoDB
mongoose_1.default
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app-dedupe')
    .then(() => {
    console.log('Connected to MongoDB');
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
