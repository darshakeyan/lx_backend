const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3030;

require('dotenv').config();

const app = express();
require('./db');

const User = require('./models/userSchema');

app.use(bodyParser.json());
app.use(cors());

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const {id} = req.body;

    console.log(token);

    if (!token) return res.status(401).json({message: "Auth Error"});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (id && decoded.id !== id) {
            return res.status(401).json({message: "Auth Error"});
        }
        req.id = decoded;
        next();
    } catch(error) {
        res.status(500).json({message:'Invalid Token'});
    }
}

app.get('/', (req,res) => {
    res.send("The API is Working");
});

app.post('/signup', async (req, res) => {
    try {
        const {name, email, password} = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({message: "User Already Exist"});
        }
        const salt = await bcrypt.genSalt(10);
        const passwordString = password.toString();
        const encryptedPassword = await bcrypt.hash(passwordString, salt);
        const newUser = new User({
            name,
            email,
            password:encryptedPassword,
        });
        await newUser.save();
        res.status(201).json({
            message: "User Sign up Successfully"
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({message:err.message})
    }
});

app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        const existingUser = await User.findOne({email});

        if (!existingUser) {
            return res.status(401).json({message:"Account Doesn't exist with this Email, Please Sign up"})
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({message:"Opps, Password is Wrong"});
        } 

        const token = jwt.sign({id:existingUser._id}, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h'
        });

        res.status(200).json({
            token,
            message: 'Logged In Success'
        });

    } catch(err) {
        res.status(500).json({message:err.message})
    }
});

app.get('/profile', authenticateToken, async (req, res) => {
    const {id} = req.body;
    const user = await User.findById(id);
    user.password = undefined;
    res.status(200).json({user});
});

app.listen(process.env.PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});