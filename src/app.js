const express = require('express');
const UserRouter = require('./user/UserRouter');
const CategoryRouter = require('./category/CategoryRouter');
const app = express();

app.use(express.json()); // parse correctlly to the database

app.use(UserRouter);
app.use(CategoryRouter);

module.exports = app;
