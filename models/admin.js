const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
});

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
});

const promotionalTagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
        required: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    brand: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
    },
    features: [{ type: String }],
    specifications: [{ type: String }],
    warranty: String,
    shippingDetails: String,
    promotionalTags: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'PromotionalTag' } // Reference promotional tags
    ],
    images: [{ type: String }], // Array to store image URLs
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

productSchema.pre('save', function (next) {
    if (!this.slug && this.name) {
        this.slug = generateSlug(this.name);
    }
    next();
});

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
}

module.exports = {
    Category: mongoose.model('Category', categorySchema),
    SubCategory: mongoose.model('SubCategory', subCategorySchema),
    Product: mongoose.model('Product', productSchema),
    PromotionalTag: mongoose.model('PromotionalTag', promotionalTagSchema),
};