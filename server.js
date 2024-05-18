require('dotenv').config();
const UserRoute = require('./router/userRoute.js');
const VendorRoute = require('./router/vendorRoute.js')
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,useUnifiedTopology: true
}).then(() => {
    console.log("Databse Connected Successfully!!");    
}).catch(err => {
    console.log('Could not connect to the database', err);
    process.exit();
});
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
const corsOptions = {
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
   
app.use(cors(corsOptions));
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));
app.use('/',UserRoute);
app.use('/',VendorRoute);

app.get('/', (req, res) => {
    res.json({"message": "Hello Crud Node Express"});
});

app.listen(7000, () => {
    console.log("Server is listening on port 7000");
});