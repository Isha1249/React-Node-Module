const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
    },
    photo:{
        type:String,
        default: null,
        set: function (value) {
          return value || null;
        }
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    deletedAt: {
        type: Date, 
        default: null, 
    },
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

module.exports = { Product };

