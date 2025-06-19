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
    res.send(`this is tooliso...`);
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
                    hasPurchased:newUser.hasPurchased
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
                name: user.name,
                hasPurchased:user.hasPurchased
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
    const {id}=req.body;
   const users = await User.findById(id);
        try{
        res.status(200).json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
       
}});

let Stripe=require('stripe');

const getCheckoutSession = async (req, res) => {
    try {
        let { user } = req.body;
        let { price } = req.body;

        let singleuser=await User.findById(user._id);
        
        
        const stripe = new Stripe(process.env.Secret_stripe_Key);
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success`, // Full success URL
            cancel_url: `${req.protocol}://${req.get('host')}/cancel`, // Full cancel URL
            customer_email: user.email,
            client_reference_id: user._id,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: price * 100, // Stripe expects amount in cents
                        product_data: {
                            name: user.name,
                            description: "payment for tooliso",
                        }
                    },
                    quantity: 1
                }
            ]
        });

         const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'tooliso100@gmail.com',
            pass: 'vlrlildnmktclpyz', // Use an app password, not your main password
        },
    });

    const mailOptions = {
        from: 'tooliso100@gmail.com',
        to: user.email,
        subject: 'Tooliso - Payment successfully recieved',
        text: `Payment Successful
Total Amount Paid: $${price + 0.10}
Thank you for your purchase!

If you have any questions or need assistance, please feel free to contact our support team.`
    };
    await transporter.sendMail(mailOptions);
        
        res.status(200).json({ success: true, message: "Successfully Paid", session,singleuser});
    } catch (error) {
        res.status(500).json({ success: false, message: `Error in checkout ${error}` });
    }
};


app.post('/checkout',getCheckoutSession);

app.listen(4000);
module.exports = app;
