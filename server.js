let express=require('express');
let cors=require('cors');
require('dotenv').config();
let bodyParser=require('body-parser');

let app=express();
app.use(cors());
app.use(bodyParser.json());

app.get('/',async(req,res)=>{
    res.send("tooliso Backend ....");
})

app.post('/gemini',async(req,res)=>{
    let prompt=req.body.prompt;

    let response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4',
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

app.post('/paraphrase',async(req,res)=>{
    let {prompt}=req.body;
    let response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4",
        {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    )
     const data=await response.json();
     res.status(200).send(data);
})


app.post('/grammerFixer',async(req,res)=>{

   try {
     let {grammerPrompt}=req.body;
    let response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAAPa9EnCi5K7_xSEfqPMxogUqlyuy9ns4',{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            contents: [{ parts: [{ text: grammerPrompt }] }]
        })
    })
    const data=await response.json();

    res.status(200).send(data);
   } catch (error) {
    res.status(500).send({ error: 'Failed to process grammar fixing.' });
   }
})


app.listen(4000);
module.exports = app;