require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");


require("./db/conn");
const Signup = require("./models/signup")

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

// login check
app.post("/index", async(req,res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await Signup.findOne({email:email});

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

// create new user
app.post("/login", async(req,res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        if(password === cpassword) {

            const registerUser = new Signup({
                email: req.body.email,
                password:password,
                cpassword: cpassword
            })
            console.log("The success part " + registerUser);

            const token = await registerUser.generateAuthUser();
            console.log("The token part is" + token);

            const registered = await registerUser.save();
            res.status(201).render("index");
        } else {
            req.send("Enter same password")
        }
    } catch (error) {
        res.status(400).send("error");
    }
})

app.listen(port, () => {
    console.log(`Listening on port number ${port}`);
})