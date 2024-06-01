// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/shop-sales-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define Product schema
const productSchema = new mongoose.Schema({
    name: String,
    buyingPrice: Number,
    sellingPrice: Number,
    quantity: Number,
});

const Product = mongoose.model('Product', productSchema);

// Define Sale schema
const saleSchema = new mongoose.Schema({
    product: String,
    quantity: Number,
    amount: Number,
    profit: Number,
    date: { type: Date, default: Date.now }
});

const Sale = mongoose.model('Sale', saleSchema);

// Routes
app.post('/products', async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.send(product);
});

app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.send(products);
});

app.post('/sales', async (req, res) => {
    const sale = new Sale(req.body);
    await sale.save();

    // Update product quantity
    const product = await Product.findOne({ name: sale.product });
    if (product) {
        product.quantity -= sale.quantity;
        await product.save();
    }

    res.send(sale);
});

app.get('/sales', async (req, res) => {
    const sales = await Sale.find();
    res.send(sales);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
