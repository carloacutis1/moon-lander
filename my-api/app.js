// import express library
const express = require('express');

// create express app instance
const app = express();

// define array of product objects
const products = [
    { id: 1, name: "laptop", price: 1000 },
    { id: 2, name: "phone", price: 500 }
];


// define route for http get requests to /api/v1/products
// this route returns the list of products in JSON format
app.get("/api/v1/products", (req, res) => {
    res.json(products); // sends response
});

// start server on port 3000; log message to console
app.listen(3000, () => console.log('API running on port 3000'));
