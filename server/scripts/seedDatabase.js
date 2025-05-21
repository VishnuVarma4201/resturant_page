const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const DeliveryBoy = require('../models/DeliveryBoy');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            MenuItem.deleteMany({}),
            DeliveryBoy.deleteMany({})
        ]);

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'Admin User',
            email: 'admin@restaurant.com',
            password: adminPassword,
            role: 'admin',
            phone: '+1234567890'
        });

        // Create regular users
        const users = [];
        for (let i = 0; i < 10; i++) {
            users.push({
                name: faker.name.findName(),
                email: faker.internet.email().toLowerCase(),
                password: await bcrypt.hash('password123', 10),
                role: 'user',
                phone: faker.phone.phoneNumber()
            });
        }
        await User.insertMany(users);

        // Create menu items
        const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
        const menuItems = [];
        
        categories.forEach(category => {
            for (let i = 0; i < 5; i++) {
                menuItems.push({
                    name: faker.commerce.productName(),
                    description: faker.lorem.sentence(),
                    price: faker.commerce.price(100, 1000, 0),
                    category,
                    image: faker.image.food(),
                    isVegetarian: Math.random() > 0.5,
                    isAvailable: true
                });
            }
        });
        await MenuItem.insertMany(menuItems);

        // Create delivery boys
        const deliveryBoys = [];
        for (let i = 0; i < 5; i++) {
            deliveryBoys.push({
                name: faker.name.findName(),
                email: faker.internet.email().toLowerCase(),
                password: await bcrypt.hash('delivery123', 10),
                phone: faker.phone.phoneNumber(),
                status: 'available'
            });
        }
        await DeliveryBoy.insertMany(deliveryBoys);

        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
