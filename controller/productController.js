const { Product } = require('../model/product');
const { newProductSchema} = require('../validations/validation');
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
const getProduct= async (req, res) => {
    try {
        if (!req.user||req.user.role !== 'vendor' && !req.user.isVendor) {
            return res.status(403).json({ status:false,message: 'Forbidden: Only vendor can get product' });
        }
        let products;
        products = await Product.find({ vendor: req.user.id,deletedAt:null }).populate('vendor', ['name', 'address', 'photo']);
        if (products.length === 0) {
            return res.status(404).json({ status: false, message: 'No products found',products });
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
        res.status(500).json({status:false,message:'Server Error'});
    }
};
module.exports ={addProduct,getProduct}
