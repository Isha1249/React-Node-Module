// Define the vendor schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        minlength: 10,
        maxlength: 12,
        unique: true,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    description:{
        type:String
    },
    photo: {
        type: String,
        default: null,
        set: function (value) {
        return value || null;
        }  
    },
    role: {
        type: String,
        enum: ['vendor'], 
        default: 'vendor', 
    },
    token:{
        type:String,
    },
    refreshToken:{type:String},
    otp: {
        type: String, 
        default: null 
    }, 
    otpExpiration: {
    type: Date,
    },
    resetToken: {
        type: String, 
        default: null 
    }, 
    resetTokenExpiration: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
    type: Date, 
    default: null, 
    },
}, { timestamps: true });

// Create the Vendor model
const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = {Vendor};
