const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // The UUID v7
  name: { type: String, required: true, unique: true },
  gender: String,
  gender_probability: Number,
  age: Number,
  age_group: String, // child, teenager, adult, or senior
  country_id: String,
  country_probability: Number,
  created_at: { type: String, default: () => new Date().toISOString() }
});

module.exports = mongoose.model('Profile', ProfileSchema);