const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    asin: {
        type: DataTypes.STRING,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING
    },
    fullPrice: {
        type: DataTypes.DECIMAL(10, 2)
    },
    category: {
        type: DataTypes.STRING
    },
    brand: {
        type: DataTypes.STRING
    },
    review_rating: {
        type: DataTypes.STRING
    },
    review_count: {
        type: DataTypes.STRING
    },
    product_mid_image: {
        type: DataTypes.STRING
    },
    product_images: {
        type: DataTypes.JSON
    },
    product_small_images: {
        type: DataTypes.JSON
    },
    rephrase_comments: {
        type: DataTypes.JSON
    }
}, {
    tableName: 'products',
    timestamps: false
});

module.exports = Product;
