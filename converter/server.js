const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Op } = require('sequelize'); // Import Op from sequelize
const sequelize = require('./config/database');
const Product = require('./models/Product');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));


app.post('/add-product', async (req, res) => {
    const {
        title,
        asin,
        link,
        fullPrice,
        category,
        brand,
        reviewRating,
        reviewCount,
        productMidImage,
        productImages,
        productSmallImages,
    } = req.body;

    try {
        const newProduct = await Product.create({
            title,
            asin,
            link,
            fullPrice,
            category,
            brand,
            reviewRating,
            reviewCount,
            productMidImage,
            productImages,
            productSmallImages,
        });
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/search', async (req, res) => {
    const searchTerm = req.query.name;
    try {
        const products = await Product.findAll({
            where: {
                title: {
                    [Op.like]: `%${searchTerm}%`
                }
            }
        });
        if (products.length > 0) {
            const product = products[0].get();
            const productDetails = {
                ...product,
                product_images: product.product_images,
                product_small_images: product.product_small_images,
            };
            const fileName = `./${product.asin}.html`; // Construct file name based on ASIN
            res.json({ productDetails, fileName });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(process.env.PORT, async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
        await sequelize.sync();
        console.log(`Server started on port ${process.env.PORT}`);
    } catch (err) {
        console.error('Unable to connect to the database:', err);
    }
});
