const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const user = require('./routes/user')
const student = require('./routes/student')
const teacher = require('./routes/teacher')

//database connection
const connectMoongoseDb = require('./config/db');
connectMoongoseDb()
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


//routes
app.use('/api/user',user)
app.use('/api/student',student)
app.use('/api/teacher',teacher)

//listening to the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on ${process.env.BASE_URL}:${port}`);
}
);