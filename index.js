require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { v7: uuidv7 } = require('uuid');
const cors = require('cors');
const Profile = require('./Profile'); // Import the schema you just made

const app = express();
app.use(express.json());
app.use(cors());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Database connection error:", err));

// 2. The POST endpoint: Create or Get Profile
app.post('/api/profiles', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    // Check if profile already exists (Idempotency)
    let existingProfile = await Profile.findOne({ name: name.toLowerCase() });
    if (existingProfile) return res.status(200).json(existingProfile);

    // Call all 3 APIs at the same time for speed
    const [genderRes, ageRes, countryRes] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${name}`),
      axios.get(`https://api.agify.io?name=${name}`),
      axios.get(`https://api.nationalize.io?name=${name}`)
    ]);

    // Classification Logic for Age Group
    const age = ageRes.data.age || 0;
    let ageGroup = "adult";
    if (age <= 12) ageGroup = "child";
    else if (age <= 19) ageGroup = "teenager";
    else if (age >= 60) ageGroup = "senior";

    // Get the top country
    const topCountry = countryRes.data.country[0] || { country_id: "Unknown", probability: 0 };

    // Create the new profile object
    const newProfile = new Profile({
      id: uuidv7(),
      name: name.toLowerCase(),
      gender: genderRes.data.gender || "unknown",
      gender_probability: genderRes.data.probability || 0,
      age: age,
      age_group: ageGroup,
      country_id: topCountry.country_id,
      country_probability: topCountry.probability
    });

    await newProfile.save();
    res.status(201).json(newProfile);

  } catch (error) {
    res.status(502).json({ error: "Error fetching data from external APIs" });
  }
});

// 3. GET endpoint: List all profiles
app.get('/api/profiles', async (req, res) => {
  const profiles = await Profile.find();
  res.json(profiles);

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
