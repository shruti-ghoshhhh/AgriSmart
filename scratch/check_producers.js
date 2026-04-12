const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const producers = await User.find({ role: 'producer' });
    console.log(`Found ${producers.length} producers.`);
    producers.forEach(p => {
      console.log(`- ${p.name}: [${p.location.coordinates}]`);
    });
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
