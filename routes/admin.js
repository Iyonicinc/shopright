const express = require('express');
const router = express.Router();
const { Category, SubCategory, Product, PromotionalTag } = require('../models/admin');
const multer = require('multer');

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Store uploaded images in 'uploads/' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);  // Unique filename
    }
});

const upload = multer({ storage });

// Create a new category
router.post('/categories', async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get a single category by ID
router.get('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update a category by ID
router.put('/categories/:id', async (req, res) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body, // Fields to update
            { new: true, runValidators: true } // Return the updated document and validate fields
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json(updatedCategory);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a category by ID
router.delete('/categories/:id', async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);

        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Get products by category ID
router.get('/categories/:categoryId/products', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const products = await Product.find({ categoryId });

        if (!products.length) {
            return res.status(200).json([]); // Return empty array if no products
        }

        res.status(200).json(products);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Create a new subcategory
router.post('/subcategories', async (req, res) => {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
        return res.status(400).json({ error: 'Both name and categoryId are required' });
    }

    try {
        const newSubCategory = new SubCategory({ name, categoryId });
        await newSubCategory.save();
        res.status(201).json(newSubCategory);
    } catch (err) {
        res.status(400).json({ error: 'Error creating subcategory: ' + err.message });
    }
});


// Get all subcategories or filter by categoryId
router.get('/subcategories', async (req, res) => {
    try {
        const { categoryId } = req.query;
        const filter = categoryId ? { categoryId } : {}; // Filter by categoryId if provided
        const subcategories = await SubCategory.find(filter);
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get products by subcategory ID
router.get('/subcategories/:subcategoryId/products', async (req, res) => {
    try {
        const products = await Product.find({ subcategoryId: req.params.subcategoryId });
        if (!products.length) {
            return res.status(404).json({ message: 'No products found for this subcategory' });
        }
        res.status(200).json(products);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a subcategory by ID
router.delete('/subcategories/:id', async (req, res) => {
    try {
        const deletedSubcategory = await SubCategory.findByIdAndDelete(req.params.id);

        if (!deletedSubcategory) {
            return res.status(404).json({ error: 'Subcategory not found' });
        }

        res.status(200).json({ message: 'Subcategory deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Create a new promotional tag
router.post('/promotional-tags', async (req, res) => {
    try {
        const newTag = new PromotionalTag(req.body);
        await newTag.save();
        res.status(201).json(newTag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all promotional tags
router.get('/promotional-tags', async (req, res) => {
    try {
        const tags = await PromotionalTag.find();
        res.status(200).json(tags);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get products by promotional tag ID
router.get('/promotional-tags/:tagId/products', async (req, res) => {
    try {
        const tagId = req.params.tagId;

        // Find products where the promotionalTags array contains the tagId
        const products = await Product.find({ promotionalTags: tagId });

        console.log(`Products found for tag ${tagId}:`, products);  // Log the products found

        if (!products.length) {
            return res.status(200).json([]); // Return empty array if no products found
        }

        res.status(200).json(products); // Return the found products
    } catch (err) {
        console.error('Error fetching products by tag:', err.message);
        res.status(400).json({ error: err.message });
    }
});


// Delete a promotional tag by ID
router.delete('/promotional-tags/:id', async (req, res) => {
    try {
        const deletedTag = await PromotionalTag.findByIdAndDelete(req.params.id);

        if (!deletedTag) {
            return res.status(404).json({ error: 'Promotional tag not found' });
        }

        res.status(200).json({ message: 'Promotional tag deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Add Product Route
router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        const { name, sku, brand, description, price, salePrice, stock, categoryId, subcategoryId, features, specifications, warranty, shippingDetails } = req.body;

        let promotionalTags = req.body.promotionalTags || [];
        if (!Array.isArray(promotionalTags)) promotionalTags = [promotionalTags];

        const images = req.files.map(file => file.path);

        const newProduct = new Product({
            name,
            sku,
            brand,
            description,
            price,
            salePrice,
            stock,
            categoryId,
            subcategoryId,
            features: features ? features.split(',').map(f => f.trim()) : [],
            specifications: specifications ? specifications.split(',').map(s => s.trim()) : [],
            warranty,
            shippingDetails,
            promotionalTags,
            images,
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(500).json({ error: 'Failed to add product', message: error.message });
    }
});


// Fetch All Products Route
router.get('/', async (req, res) => {
    try {
        const products = await Product.find()
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('promotionalTags', 'name');
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({ error: 'Failed to fetch products', message: error.message });
    }
});


// Get a product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId').populate('subcategoryId').populate('promotionalTags');
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/products/:id', upload.array('images'), async (req, res) => {
    try {
        const { name, slug, sku, brand, description, price, salePrice, stock, categoryId, subcategoryId, features, specifications, warranty, shippingDetails } = req.body;
        
        // Handle promotionalTags (ensure it's always an array)
        let promotionalTags = req.body.promotionalTags || [];
        if (!Array.isArray(promotionalTags)) {
            promotionalTags = [promotionalTags]; // Convert single value to array
        }

        const updatedData = {
            name,
            slug: slug || generateSlug(name),
            sku,
            brand,
            description,
            price,
            salePrice,
            stock,
            categoryId,
            subcategoryId,
            features: features ? features.split(',').map(f => f.trim()) : [],
            specifications: specifications ? specifications.split(',').map(s => s.trim()) : [],
            promotionalTags,
            warranty,
            shippingDetails
        };

        // Handle image uploads if provided
        if (req.files && req.files.length > 0) {
            const imagePaths = req.files.map(file => file.path);
            updatedData.images = imagePaths;
        }

        // Update the product in the database
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (err) {
        console.error('Error updating product:', err.message);
        res.status(400).json({ error: err.message });
    }
});


// Delete a product
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get products by category (Electronics in this case)
router.get('/products/category/:categoryName', async (req, res) => {
    try {
        const categoryName = req.params.categoryName;
        const products = await Product.find({ category: categoryName });

        if (!products.length) {
            return res.status(404).json({ error: `No products found in ${categoryName} category` });
        }

        res.status(200).json(products);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


module.exports = router;
