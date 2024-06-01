const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Define Product schema
const productSchema = new mongoose.Schema({
    name: String,
    buyingPrice: Number,
    sellingPrice: Number,
    quantity: Number,
});

const Product = mongoose.model('Product', productSchema);

// Middleware to get a product by ID
async function getProduct(req, res, next){
    let product;
    try{
        product = await Product.findById(req.params.id);
        if(product == null){
            return res.status(404).json({ message: "Product not found."});
        }
    } catch(err){
        return res.status(500).json({ message: err.message });
    }
    res.product = product;
    next();
}

// Fetch all products
router.get('/', async (req, res) => {
    try{
        const products = await Product.find();
        res.json(products);
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
});

// Fetch a single product
router.get('/:id', getProduct, (req, res) => {
    res.json(res.product);
});

// Create a new product
router.post('/', async (req, res) => {
    const product = new Product({
        name: req.body.name,
        buyingPrice: req.body.buyingPrice,
        sellingPrice: req.body.sellingPrice,
        quantity: req.body.quantity
    });

    try{
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch(err){
        res.status(400).json({ message: err.message });
    }
});

// Update a product
router.put('/:id', getProduct, async (req, res) => {
    if(req.body.name != null){
        res.product.name = req.body.name;
    }
    if(req.body.buyingPrice != null){
        res.product.buyingPrice = req.body.buyingPrice;
    }
    if(req.body.sellingPrice != null){
        res.product.sellingPrice = req.body.sellingPrice;
    }
    if(req.body.quantity != null){
        res.product.quantity = req.body.quantity;
    }

    try{
        const updatedProduct = await res.product.save();
        res.json(updatedProduct);
    } catch(err){
        res.status(400).json({ message: err.message });
    }
});

// Delete a product
router.delete('/:id', getProduct, async (req, res) => {
    try{
        await res.product.remove();
        res.json({ message: "Product deleted" });
    } catch(err){
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
