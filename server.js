const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Op } = require('sequelize'); // Import Op from sequelize
const sequelize = require('./config/database');
const Product = require('./models/Product');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
                rephrase_comments: product.rephrase_comments
            };
            // const fileName = `your_file_directory/${product.asin}.html`; // Construct file name based on ASIN
            const fileName = `./1.html`;
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
