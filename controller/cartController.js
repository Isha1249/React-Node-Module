
const {Cart} = require('../model/cart');
const { User } = require('../model/user');
const { Product } = require('../model/product');
const { addItemSchema} = require('../validations/validation');
const addItem = async (req, res) => {
    try {
        const { error } = addItemSchema.validate(req.body); 
        if (error) {
            return res.status(400).json({ status: false, message: error.details[0].message });
        }
        const userId = req.user._id; 
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'Account not found.',
            });
        }
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                status: false,
                message: 'Product not found.',
            });
        }

        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity }]
            });
        } else {
            const existingItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
            if (existingItemIndex !== -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
        }
        const newItemPrice = product.price * quantity;
        cart.totalPrice += newItemPrice;
        await cart.save();
        res.status(200).json({ status: true, message: 'Item added to cart successfully',cart });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};
const decreaseQuantity = async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        let cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({
                status: false,
                message: 'Cart not found.',
            });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);
        if (existingItemIndex === -1) {
            return res.status(404).json({
                status: false,
                message: 'Item not found in cart.',
            });
        }
        cart.items[existingItemIndex].quantity--;
        if (cart.items[existingItemIndex].quantity === 0) {
            cart.items.splice(existingItemIndex, 1);
        }
        cart.totalPrice = cart.items.reduce((total, item) => {
            const itemPrice = item.quantity * item.product.price;
            return total + itemPrice;
        }, 0);

        // If cart becomes empty, delete the cart record
        if (cart.items.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ status: true, message: 'Item quantity decreased successfully and cart deleted', totalPrice: 0 });
        }
        await cart.save();
        res.status(200).json({ status: true, message: 'Item quantity decreased successfully', totalPrice: cart.totalPrice });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};
const getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'user',
                select: 'firstName lastName email phone'
            })
            .populate({
                path: 'items.product',
                select: 'name price quantity photo vendor',
                populate: {
                    path: 'vendor',
                    select: 'name address photo phone email'
                }
            });

        if (!cart) {
            return res.status(404).json({
                status: false,
                message: 'Cart not found.',
            });
        }
        const populatedCart = {
            ...cart.toObject(),
            items: cart.items.map(item => {
                return {
                    ...item.toObject(),
                    product: {
                        ...item.product.toObject(),
                        photo: process.env.BACKEND_BASE_URL + '/uploads/' + item.product.photo,
                        vendor: {
                            ...item.product.vendor.toObject(),
                            photo: process.env.BACKEND_BASE_URL + '/uploads/' + item.product.vendor.photo
                        }
                    }
                };
            })
        };

        res.status(200).json({ status: true, message: 'Cart details retrieved successfully', cart: populatedCart });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: false, message: 'Server Error' });
    }
};
module.exports = {addItem,decreaseQuantity,getCart};
