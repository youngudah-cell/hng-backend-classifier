const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/classify', async (req, res) => {
    const name = req.query.name;

    // 1. Handle Missing/Empty Name (Requirement for 400/422 error)
    if (!name || name.trim() === "") {
        return res.status(400).json({
            status: "error",
            message: "name parameter is required"
        });
    }

    try {
        // 2. Fetch data from Genderize
        const response = await axios.get(`https://api.genderize.io?name=${name}`);
        const result = response.data;

        // 3. Construct the EXACT response the bot wants
        res.status(200).json({
            status: "success",
            data: {
                name: result.name,
                gender: result.gender || "unknown",
                probability: result.probability || 0,
                sample_size: result.count || 0,
                is_confident: result.probability > 0.5, // Confidence Logic
                processed_at: new Date().toISOString() // ISO 8601 Format
            }
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: "External API failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));