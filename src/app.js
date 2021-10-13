require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

require("./db/conn");
const User = require("./models/signup");
const {verifyEmail} = require("./middleware/JWT")

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/donation", (req, res) => {
    res.render("donation");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/about-us", (req, res) => {
    res.render("about-us");
})

app.get("/volunteer", (req, res) => {
    res.render("volunteer");
})

app.get("/admin", (req, res) => {
    res.render("admin");
})

// login check
app.post("/index",verifyEmail, async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await User.findOne({email:email});

        const isMatch = await bcrypt.compare(password, useremail.password);

        const token = await useremail.generateAuthUser();
        console.log("The token part is " + token);

        if(isMatch) {
            res.status(201).render("index");
        }else {
            res.send("Invalid credentials")
        }
        
    } catch (error) {
        res.status(400).send("Error");
    }
})


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.password
    },
    tls: {
        rejectUnauthorized: false
    }
})







// create new user
app.post("/login", async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if(password === cpassword) {
            
            const newUser = new User({
                email,
                password,
                // cpassword,
                emailToken: crypto.randomBytes(64).toString('hex'),
                isVerified: false
            })
            console.log("1");
            console.log("The success part " + newUser);

            const token = await newUser.generateAuthUser();
            console.log("The token part is" + token);

            res.cookie("jwt", token, {
                httpOnly:true
            });
            
            const registered = await newUser.save();

            var mailOptions = {
                from: ' "kjai4101@gmail.com',
                to: email,
                subject: 'kunaljain -verify your email',
                text: `<h2> ! Thanks for registerating with our NGO</h2>
                        <h4> Please verify your mail to continue...</h4>
                        <a href=""http://${req.headers.host}/verify-email?token=${newUser.emailToken}">Verify your Email</a>`
            };

            // sending mail
            transporter.sendMail(mailOptions, function(error, info){
                if(error) {
                    console.log(error);
                }
                else {
                    console.log("Verification email is sent to your gmail account");
                }
            })

            res.status(201).render("index");
        } else {
            req.send("Enter same password")
        }
    } catch (error) {
        res.status(400).send(error);
    }
})

app.get('/verify-email', async(req,res) => {
    try {
        const token = req.query.token;
        User.updateMany(
            {emailToken : token},
            {emailToken : null,
            isVerified : true},
            function(error, result) {
                if(error) {
                    res.json({
                        status: false
                    })
                }
                res.render('login')
            }
        )
    } catch (error) {
        console.log(error);
    }
})

app.listen(port, () => {
    console.log(`Listening on port number ${port}`);
})