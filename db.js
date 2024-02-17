const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.ATLAS_URI).then(
    () => {
        console.log("Connected to Database");
    }
).catch((error) => {
    console.log("Error Connecting to Database", error); 
});