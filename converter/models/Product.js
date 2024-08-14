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
    reviewRating: {
        type: DataTypes.STRING
    },
    reviewCount: {
        type: DataTypes.STRING
    },
    productMidImage: {
        type: DataTypes.STRING
    },
    productImages: {
        type: DataTypes.JSON
    },
    productSmallImages: {
        type: DataTypes.JSON
    },
}, {
    tableName: 'products',
    timestamps: false
});

module.exports = Product;
