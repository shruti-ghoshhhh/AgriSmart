const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({path: './backend/.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const user = await User.findOne({ role: 'producer' });
        console.log('User found:', user.name);
        user.location = {
            type: 'Point',
            coordinates: [77.2, 28.6]
        };
        await user.save();
        console.log('Save successful');
        process.exit();
    } catch (err) {
        console.error('Save failed:', err);
        process.exit(1);
    }
});
