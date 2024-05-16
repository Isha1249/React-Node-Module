const express = require('express');
const router = express.Router();
require('express-group-routes');
const authMiddleware = require('../middleware/jsonwebtoken');
const { upload } = require('../middleware/formdata.js');
const UserController = require('../controller/userController.js');


router.group("/user", (router) => {   
    router.post('/signup',upload.single('photo'), UserController.signup);
    router.post('/verify-otp', UserController.verifyOTP); 
    router.post('/login', UserController.login); 
    router.post('/forgot-password/request-link',UserController.requestForgotPasswordLink);
    router.post('/forgot-password/reset/:token',UserController.resetPasswordUsingLink);
    // router.post('/refresh-token',UserController.refreshToken);

    router.use(authMiddleware.verifyToken);
    router.post('/change-password',UserController.requestPasswordChange);
    router.post('/logout',UserController.logout);
    router.get('/profile',UserController.profile);
    router.put('/edit-profile',upload.single('photo'),UserController.editProfile); 
   

    
});
module.exports = router;
