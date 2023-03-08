require('dotenv').config();
const express = require('express')
const app = express();
const path = require('path');
const cors = require('cors')
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3500;

//Connect to MongoDB
connectDB();


//custom middleware
//custom middleware logger
//apply to all underneath
app.use(logger);

//Cross Origin Resource Sharing
//put location of your domain of your react app
app.use(cors(corsOptions));

//built-in middleware to handle urlencoded data
//in other words, form data:
//'content-type: application/x-www-form-urlencoded'
//เนื่องจากเอาไว้ด้านบน จึงเป็นการ apply middleware to all routes beneath
app.use(express.urlencoded({ extended: false}));

// built-in middleware for json
app.use(express.json());

//  middleware for cookies
app.use(cookieParser())


//serve static files //make it available for public , 
//no need for ../css/style.css but just css/style.css
//default ตัวแรก คือ '/'
app.use('/',express.static(path.join(__dirname, '/public')));

//^ start with, $ end with
app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT);
app.use('/employees', require('./routes/api/employees'));
app.use('/users', require('./routes/api/users'));

// Route handlers

// app.use('/') not use rejex but app.all() can use
app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views','404.html'));
    }
    else if (req.accepts('json')) {
        res.json({ error: "404 Not Found"});
    }
    else {
        res.type('txt').send("404 Not Found")
    }
});

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, ()=> console.log(`Server running on port  ${PORT}`))
})
