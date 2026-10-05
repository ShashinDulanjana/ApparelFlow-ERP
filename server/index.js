const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('ApparelFlow ERP Gatekeeper Server is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});