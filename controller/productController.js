const { Product } = require('../model/product');
const { newProductSchema,editProductSchema} = require('../validations/validation');
const addProduct = async (req, res) => {
    try {
        if (!req.user||req.user.role !== 'vendor' && !req.user.isVendor) {
            return res.status(403).json({ status:false,message: 'Forbidden: Only vendor can add product' });
        }
        const { error } = newProductSchema.validate(req.body); 
        if (error) {
          return res.status(400).json({ status: false, message: error.details[0].message });
        }
        const { name, price, quantity } = req.body;
        let photo = '';
        if (req.file) {
        photo = req.file.filename;
        }
        const newProduct = new Product({
            name,
            price,
            quantity,
            photo,
            vendor: req.user.id

        });
        const product = await newProduct.save();
        res.status(200).json({status:true,message:"Product Added Successfully",product});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({status:false,message:'Server Error'});
    }
};
const getProduct = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'vendor' && !req.user.isVendor)) {
            return res.status(403).json({ status: false, message: 'Forbidden: Only vendors can get products' });
        }
        let { search, sort } = req.query;
        let products;
        let query = { vendor: req.user.id, deletedAt: null };
        if (search) {
            query.name = { $regex: new RegExp(search, 'i') }; 
        }
        products = await Product.find(query).populate('vendor', ['name', 'address', 'photo']);
        if (products.length === 0) {
            return res.status(404).json({ status: false, message: 'No products found', products });
        }
        if (sort) {
            if (sort === 'asc') {
                products.sort((a, b) => a.price - b.price); 
            } else if (sort === 'desc') {
                products.sort((a, b) => b.price - a.price); 
            }
        }
        const productsWithPhotoURL = products.map(product => {
            const vendor = product.vendor.toObject();
            const vendorPhotoURL = process.env.BACKEND_BASE_URL + '/uploads/' + vendor.photo;
            return {
                ...product.toObject(),
                vendor: {
                    ...vendor,
                    photo: vendorPhotoURL
                },
                photo: process.env.BACKEND_BASE_URL + '/uploads/' + product.photo
            };
        });

        res.status(200).json({
            status: true,
            message: "Product Details",
            products: productsWithPhotoURL
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};
// Edit API for Product
const editProduct = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'vendor' && !req.user.isVendor)) {
            return res.status(403).json({ status: false, message: 'Forbidden: Only vendors can edit products' });
        }
        const { error } = editProductSchema.validate(req.body); 
        if (error) {
          return res.status(400).json({ status: false, message: error.details[0].message });
        }
        const { name, price, quantity} = req.body;
        const productId = req.params.productId;
        const product = await Product.findOne({ _id: productId, vendor: req.user.id,deletedAt:null });
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found or you are not authorized to edit this product' });
        }
        let photo = '';
        if (req.file) {
            photo = req.file.filename;
        }
        if(name){product.name = name};
        if(price) {product.price = price};
        if(quantity){ product.quantity = quantity};
        if (photo !== '') {
            product.photo = photo;
        }
        await product.save();
        res.status(200).json({ status: true, message: 'Product updated successfully', product });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'vendor' && !req.user.isVendor)) {
            return res.status(403).json({ status: false, message: 'Forbidden: Only vendors can delete products' });
        }
        const productId = req.params.productId;
        const product = await Product.findOne({ _id: productId, vendor: req.user.id,deletedAt:null});
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found or you are not authorized to delete this product' });
        }
        product.deletedAt = new Date();
        await product.save();
        res.status(200).json({ status: true, message: 'Product deleted successfully',product });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};

module.exports = { addProduct,getProduct, editProduct,deleteProduct};


