"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const auth_1 = require("../middleware/auth");
const AppName_1 = require("../models/AppName");
const Cluster_1 = require("../models/Cluster");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const allowedAdminEmails = ['calvin.liew@sanofi.com', 'yuyou.wu@sanofi.com'];
console.log('Admin CSV upload route loaded');
router.post('/upload-csv', auth_1.auth, upload.single('file'), async (req, res) => {
    var _a, _b, _c;
    console.log('--- /api/admin/upload-csv handler called ---');
    try {
        const user = req.user;
        if (!user || !allowedAdminEmails.includes((_a = user.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase())) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const csv = req.file.buffer.toString('utf-8');
        let records;
        try {
            records = (0, sync_1.parse)(csv, { columns: true, trim: true, skip_empty_lines: true });
        }
        catch (err) {
            console.error('CSV parse error:', err);
            return res.status(400).json({ error: 'Invalid CSV format', details: err instanceof Error ? err.message : err });
        }
        try {
            // Clear all clusters and app names before ingesting new data
            await Cluster_1.Cluster.deleteMany({});
            await AppName_1.AppName.deleteMany({});
            console.log('Cleared all clusters and app names');
            // Normalize column names for all records
            if (records.length > 0) {
                const originalKeys = Object.keys(records[0]);
                console.log('Detected CSV columns:', originalKeys);
                for (let i = 0; i < records.length; i++) {
                    const row = records[i];
                    for (const key of originalKeys) {
                        const normalizedKey = key.trim().toLowerCase();
                        if (normalizedKey !== key) {
                            row[normalizedKey] = row[key];
                            delete row[key];
                        }
                    }
                }
            }
            for (const [i, row] of records.entries()) {
                // Accept both header formats, normalized
                const canonicalName = ((_b = row['canonical name']) === null || _b === void 0 ? void 0 : _b.trim()) || ((_c = row['standardized_app']) === null || _c === void 0 ? void 0 : _c.trim());
                let variantsRaw = row['variants'] || row['similar_app_names'] || '';
                console.log(`Row ${i + 1}: canonicalName='${canonicalName}', variantsRaw='${variantsRaw}'`);
                let variants = [];
                if (typeof variantsRaw !== 'string') {
                    variantsRaw = String(variantsRaw);
                }
                const trimmed = variantsRaw.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        const jsonStr = trimmed.replace(/'/g, '"');
                        variants = JSON.parse(jsonStr);
                    }
                    catch (e) {
                        console.warn(`Could not parse variants list in row ${i + 1}:`, variantsRaw);
                        variants = [trimmed.slice(1, -1)];
                    }
                }
                else if (trimmed.length > 0) {
                    variants = trimmed.split(',').map((v) => v.trim()).filter(Boolean);
                }
                if (!canonicalName) {
                    console.warn(`Row ${i + 1} missing Canonical Name, skipping.`);
                    continue;
                }
                // Create cluster for this canonical name
                const cluster = new Cluster_1.Cluster({
                    name: canonicalName,
                    canonicalName,
                    description: '',
                    createdBy: user._id,
                });
                await cluster.save();
                console.log(`Created cluster: ${canonicalName}`);
                // Add canonical name as an app (unconfirmed)
                await AppName_1.AppName.create({
                    name: canonicalName,
                    canonicalName,
                    cluster: cluster._id,
                    confirmed: false,
                    createdBy: user._id,
                });
                console.log(`Created app: ${canonicalName}`);
                // Add each variant as an app name in this cluster
                for (const variant of variants) {
                    if (variant) {
                        await AppName_1.AppName.create({
                            name: variant,
                            canonicalName,
                            cluster: cluster._id,
                            confirmed: false,
                            createdBy: user._id,
                        });
                        console.log(`Created app variant: ${variant}`);
                    }
                }
            }
            res.json({ message: 'CSV ingested successfully' });
        }
        catch (dbErr) {
            console.error('Database error during CSV ingestion:', dbErr);
            res.status(500).json({ error: 'Database error', details: dbErr instanceof Error ? dbErr.message : dbErr });
        }
    }
    catch (error) {
        console.error('Server error during CSV upload:', error);
        res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : error });
    }
});
// Stats endpoint for dashboard
router.get('/stats', async (req, res) => {
    try {
        const totalApps = await AppName_1.AppName.countDocuments();
        const confirmedApps = await AppName_1.AppName.countDocuments({ confirmed: true });
        const unconfirmedApps = await AppName_1.AppName.countDocuments({ confirmed: false });
        res.json({
            totalApps,
            confirmedApps,
            unconfirmedApps,
            pendingReviews: unconfirmedApps, // alias for dashboard
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Export only clusters that are 100% confirmed
router.get('/export-clusters', async (req, res) => {
    try {
        const clusters = await Cluster_1.Cluster.find();
        const data = await Promise.all(clusters.map(async (cluster) => {
            const apps = await AppName_1.AppName.find({ cluster: cluster._id });
            const allConfirmed = apps.length > 0 && apps.every(app => app.confirmed);
            if (!allConfirmed)
                return null;
            return {
                cluster: cluster.canonicalName || cluster.name,
                apps: apps.map(app => app.name)
            };
        }));
        // Filter out nulls (clusters not 100% confirmed)
        res.json(data.filter(Boolean));
    }
    catch (error) {
        res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : error });
    }
});
exports.default = router;
