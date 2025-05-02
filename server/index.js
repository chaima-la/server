require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const extractFiltersRouter = require('./routes/Chat');


const app = express();
app.use(cors());
app.use(express.json());

// Configurations
const PORT = 5000;


// Helper function to clean AI response

app.use(express.json())
app.use('/', extractFiltersRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));