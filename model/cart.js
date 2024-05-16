const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
    }],
    totalPrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Cart };

