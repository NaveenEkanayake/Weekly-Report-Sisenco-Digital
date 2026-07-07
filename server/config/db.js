import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Seed default manager user if no users exist
    const userCount = await User.countDocuments();
    let    systemUser = await User.findOne({ email: 'system@weeklyreports.com' });
    
    if (userCount === 0 && !systemUser) {
      systemUser = await User.create({
        name: 'System Manager',
        email: 'system@weeklyreports.com',
        password: 'Password123!',
        role: 'Manager',
        department: 'Operations',
      });
      console.log('🌱 Seeded default Manager: system@weeklyreports.com / Password123!');
    } else if (!systemUser) {
      // Find any manager or any user to assign projects
      systemUser = await User.findOne({ role: 'Manager' }) || await User.findOne();
    }

    // Seed default projects if empty
    const projectCount = await Project.countDocuments();
    if (projectCount === 0 && systemUser) {
      const defaultProjects = [
        { name: 'Client A', description: 'Client A Project Deliverables', category: 'Client Work', createdBy: systemUser._id },
        { name: 'Internal Tooling', description: 'Internal productivity tools development', category: 'Internal Tooling', createdBy: systemUser._id },
        { name: 'R&D', description: 'Research & development of new features', category: 'R&D', createdBy: systemUser._id },
        { name: 'Marketing', description: 'Growth marketing and campaign tracking', category: 'Marketing', createdBy: systemUser._id },
      ];
      await Project.insertMany(defaultProjects);
      console.log('🌱 Seeded default projects: Client A, Internal Tooling, R&D, Marketing');
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

