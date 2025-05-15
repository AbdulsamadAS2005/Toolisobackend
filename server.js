let express=require('express');
let cors=require('cors');
require('dotenv').config();
let bodyParser=require('body-parser');

let app=express();
app.use(cors());
app.use(bodyParser.json());

app.post('/gemini',async(req,res)=>{
    let prompt=req.body.prompt;

    let response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
        {
            method:"POST",
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    )
    const data=await response.json();
    res.send(data);
    
})
