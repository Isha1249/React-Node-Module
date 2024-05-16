const express = require('express');
const router = express.Router();
require('express-group-routes');
const authMiddleware = require('../middleware/jsonwebtoken');
const { upload } = require('../middleware/formdata.js');
const VendorController = require('../controller/vendorController.js');
const ProductController = require('../controller/productController.js');
router.group("/vendor", (router) => {   
    router.post('/signup',upload.single('photo'), VendorController.signup);
    router.post('/verify-otp', VendorController.verifyOTP); 
    router.post('/login', VendorController.login); 
    // router.post('/forgot-password/request-link',UserController.requestForgotPasswordLink);
    // router.post('/forgot-password/reset/:token',UserController.resetPasswordUsingLink);

    router.use(authMiddleware.verifyToken);
    router.post('/logout',VendorController.logout);
    router.get('/profile',VendorController.profile);
    router.put('/edit-profile',upload.single('photo'),VendorController.editProfile); 

    //Product
    router.post('/add-product',upload.single('photo'),ProductController.addProduct);
    router.get('/get-products',ProductController.getProduct);
    router.put('/edit-product/:productId',upload.single('photo'),ProductController.editProduct);
    router.delete('/delete-product/:productId',ProductController.deleteProduct);

});
module.exports = router;
