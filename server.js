let express = require('express');
let cors = require('cors');
require('dotenv').config();
let bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

let app = express();
app.use(cors());
app.use(bodyParser.json());

let db = require('./connection');
db();
const mongoose = require('mongoose');
app.get('/', async (req, res) => {
    res.send(`tooliso.com...`);
})

app.post('/gemini', async (req, res) => {
    let prompt = req.body.prompt;

    let response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4',
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    )
    const data = await response.json();
    res.send(data);

})

app.post('/paraphrase', async (req, res) => {
    let { prompt } = req.body;
    let response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    )
    const data = await response.json();
    res.status(200).send(data);
})


app.post('/grammerFixer', async (req, res) => {

    try {
        let { grammerPrompt } = req.body;
        let response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: grammerPrompt }] }]
            })
        })
        const data = await response.json();

        res.status(200).send(data);
    } catch (error) {
        res.status(500).send({ error: 'Failed to process grammar fixing.' });
    }
})


app.post('/send-code', async (req, res) => {
    const { email } = req.body;

    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code

    // Save code in DB or cache (like Redis) associated with email for later verification

    // Configure mail transporter (example using Gmail)
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'tooliso100@gmail.com',
            pass: 'vlrlildnmktclpyz', // Use an app password, not your main password
        },
    });

    const mailOptions = {
        from: 'tooliso100@gmail.com',
        to: email,
        subject: 'Tooliso - Verify Your Email Address',
        text: `Hello,

Thanks for signing up with Tooliso! To complete your verification, please use the code below:

🔐 Your verification code: ${verificationCode}

This code will expire in 10 minutes. If you didn’t request this, you can safely ignore this email.

– The Tooliso Team`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Code sent', code: verificationCode }); // remove code in production
    } catch (error) {
        res.status(500).json({ success: false, message: 'Email failed to send', error });
    }
});


const userSchema = new mongoose.Schema({
    name: String,
    phone: Number,
    country: String,
    email: String,
    password: String,
    hasPurchased: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const User = mongoose.model("UserInfo", userSchema);

const jwt = require('jsonwebtoken');
app.post('/addUser', async (req, res) => {

    try {
        let { name, email, phone, country, password } = req.body;

        const exist = await User.findOne({ email });

        if (exist) {
            res.status(202).json({ success: false, message: 'Email is already registered' });
        }
        else {
            const newUser = new User({ name, email, phone, country, password });
            await newUser.save();
            const token = jwt.sign(
                { userId: newUser._id },
                'myVeryStrongSecretKey123!@#',
                { expiresIn: '7d' }
            );
            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                token,
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                },
            });
        }

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }

})

app.post('/loginUser', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic input validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({  // Keeping your 200 status for false
                success: false, 
                message: "User not found" 
            });
        }

        // Plain password comparison (as requested)
        if (user.password !== password) {
            return res.status(200).json({
                success: false,
                message: "Password is incorrect"
            });
        }

        // Token generation
        const token = jwt.sign(
            { userId: user._id },  // Fixed typo: changed newUser to user
            'myVeryStrongSecretKey123!@#',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(400).json({ 
            success: false, 
            message: "Login failed" 
        });
    }
});


app.get('/allusers',async(req,res)=>{

   try {
        // Find all users but exclude the password field
        const users = await User.find().select('-password');
        
        res.status(200).json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
})

app.post('/setNewPassword',async(req,res)=>{
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { password: password }, // plain text password
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal server error." });
    }
})

app.post('/getSingleUser', async (req, res) => {
    try {
        const { id } = req.body;
        
        // Validate the ID exists
        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Find user by ID - corrected query
        const user = await User.findById(id);  // Use findById instead of findOne
        
        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user data (exclude sensitive info like password)
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            hasPurchased:hasPurchased
            // include other non-sensitive fields
        };
        
        res.status(200).json(userData);
        
    } catch (error) {
        console.error('Error fetching user:', error);
    }
});

app.listen(4000);
module.exports = app;