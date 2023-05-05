const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const express = require('express');
const dotenv = require('dotenv');
const User = require('./user');
const chatList = require('./Chat.sandbox.js')
dotenv.config()
const cookieParser = require('cookie-parser')
const socket = require('socket.io')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
const server = app.listen(process.env.PORT, ()=>{
    console.log("Server is ready @ localhost:" + process.env.PORT + '/');
    mongoose.connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(()=>{
        console.log('DB don connect')
    }).catch((err)=>{
        console.log('Error')
    })
})
app.set('view engine', 'ejs')
app.get('/', async (req, res)=>{
    res.render('signUp')
})

app.get('/sign', async (req, res)=>{
    res.render('signIn')
})

app.post('/sign-up', async (req, res) => {
    // Get the form data from the req.body object
    const { user_name, email, password } = req.body;
  
    // Check if any of the form fields are empty
    if (!user_name || !email || !password) {
      res.render('error', {
        message: "Fill in the required fields"
      });
    } else {
      // Check if a user with the same email address already exists
      const existingUser = await User.findOne({ email_address: email });
      if (existingUser) {
        res.render('error', {
            message: 'A User with these credentials exist'
        });
      } else {
        // Create a new user with the submitted form data
        await User.create({
          user_name: user_name,
          email_address: email,
          password: password
        });
        // Redirect the user to the sign-in page
        res.redirect('/sign');
      }
    }
  });
  

app.post('/sign-in', async (req, res)=>{
        const { email, password } = req.body;
        if (!email || !password) {
            res.render('error', {
                message: 'Enter your details'
            })
        }
        else {
            const existingUser = await User.findOne({ email_address: email, password: password });
            if (existingUser) {
                const token = jwt.sign({
                    email: email,
                    password: password,
                    name: existingUser.user_name
                }, process.env.SECRET, {
                    expiresIn: 3*24*60*60
                })
                res.cookie('userToken', token, {
                    httpOnly: true,
                    maxAge: 3*24*60*60*1000
                }).redirect('/chat')
            }
            else {
                res.redirect('/sign')
            }
        }
    
    }
)

app.get('/chat', async (req, res)=>{
    const token = req.cookies.userToken;
    if (token) {
        jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
            if (!err) {
                res.render('index', {
                    name: decodedToken.name,
                    email: decodedToken.email,
                    chats: chatList,
                    port: process.env.PORT
                })
            }
            else {
                res.redirect('/sign')
            }
        })
    }
    else {
        res.redirect('/sign')
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('userToken');
    res.redirect('/');
});

const io = socket(server)
io.on('connection', async (socket)=> {
    console.log(`Connection made @ id: ${socket.id}`)
    socket.on('chat message', function (data) {
        chatList.push(data)
        io.sockets.emit('chat message', data)
    })
})