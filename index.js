const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Rule: CORS header Access-Control-Allow-Origin: *
app.use(cors());

app.get('/api/classify', async (req, res) => {
    const { name } = req.query;

    // Rule: Error if name is missing
    if (!name) {
        return res.status(400).json({
            status: "error",
            message: "Missing or empty name parameter"
        });
    }

    // Rule: Error if name is not a string (checks if it's not a number or object)
    if (typeof name !== 'string' || !isNaN(name)) {
        return res.status(422).json({
            status: "error",
            message: "name is not a string"
        });
    }

    try {
        const response = await axios.get(`https://api.genderize.io/?name=${name}`);
        const data = response.data;

        // Rule: Handle Genderize edge cases
        if (!data.gender || data.count === 0) {
            return res.status(200).json({
                status: "error",
                message: "No prediction available for the provided name"
            });
        }

        // Rule: Confidence Logic (probability >= 0.7 AND sample_size >= 100)
        const sample_size = data.count; // Renaming count to sample_size
        const is_confident = data.probability >= 0.7 && sample_size >= 100;

        // Rule: Success Structure
        res.status(200).json({
            status: "success",
            data: {
                name: data.name,
                gender: data.gender,
                probability: data.probability,
                sample_size: sample_size,
                is_confident: is_confident,
                processed_at: new Date().toISOString() // Rule: UTC, ISO 8601
            }
        });

    } catch (error) {
        // Rule: 500/502 Error
        res.status(502).json({
            status: "error",
            message: "Upstream or server failure"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});