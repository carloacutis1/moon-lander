// import express library
const express = require('express');

// create express app instance
const app = express();

// define route for http get requests to root url
// this route sends a simple text response to client
app.get('/', (req, res) => {
    res.send('Welcome to my API'); // sends response
});

// start server on port 3000; log message to console
app.listen(3000, () => console.log('API running on port 3000'));
