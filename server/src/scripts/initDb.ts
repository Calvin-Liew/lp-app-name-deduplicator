import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AppName } from '../models/AppName';
import { Cluster } from '../models/Cluster';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await AppName.deleteMany({});
    await Cluster.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user calvin.liew@sanofi.com
    const calvin = new User({
      name: 'Calvin Liew',
      email: 'calvin.liew@sanofi.com',
      password: await bcrypt.hash('test1234', 8),
      tokens: [],
    });
    await calvin.save();
    console.log('Created user calvin.liew@sanofi.com with password test1234');

    // Create sample contributors
    const contributors = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
      },
    ];

    const createdUsers = await Promise.all(
      contributors.map(async (contributor) => {
        const user = new User({
          name: contributor.name,
          email: contributor.email,
          password: await bcrypt.hash(contributor.password, 8),
        });
        await user.save();
        return user;
      })
    );
    console.log('Created sample contributors');

    // Create sample clusters
    const officeCluster = new Cluster({
      name: 'Microsoft Office',
      canonicalName: 'microsoft-office',
      description: 'Microsoft Office applications',
      createdBy: createdUsers[0]._id,
    });
    await officeCluster.save();

    const adobeCluster = new Cluster({
      name: 'Adobe Creative Suite',
      canonicalName: 'adobe-creative-suite',
      description: 'Adobe Creative Suite applications',
      createdBy: createdUsers[0]._id,
    });
    await adobeCluster.save();

    const commCluster = new Cluster({
      name: 'Communication Tools',
      canonicalName: 'communication-tools',
      description: 'Communication and collaboration tools',
      createdBy: createdUsers[1]._id,
    });
    await commCluster.save();
    console.log('Created sample clusters');

    // Create sample app names
    const apps = [
      {
        name: 'Microsoft Excel',
        canonicalName: 'microsoft-excel',
        cluster: officeCluster._id,
        confirmed: true,
        confirmedBy: createdUsers[0]._id,
        confirmedAt: new Date(),
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'MS Excel',
        canonicalName: 'microsoft-excel',
        cluster: officeCluster._id,
        confirmed: false,
        createdBy: createdUsers[1]._id,
      },
      {
        name: 'Adobe Photoshop',
        canonicalName: 'adobe-photoshop',
        cluster: adobeCluster._id,
        confirmed: true,
        confirmedBy: createdUsers[1]._id,
        confirmedAt: new Date(),
        createdBy: createdUsers[0]._id,
      },
      {
        name: 'PS',
        canonicalName: 'adobe-photoshop',
        cluster: adobeCluster._id,
        confirmed: false,
        createdBy: createdUsers[1]._id,
      },
      {
        name: 'Slack',
        canonicalName: 'slack',
        cluster: commCluster._id,
        confirmed: true,
        confirmedBy: createdUsers[0]._id,
        confirmedAt: new Date(),
        createdBy: createdUsers[1]._id,
      },
      {
        name: 'Slack Desktop',
        canonicalName: 'slack',
        cluster: commCluster._id,
        confirmed: false,
        createdBy: createdUsers[0]._id,
      },
    ];

    await AppName.insertMany(apps);
    console.log('Created sample app names');

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 