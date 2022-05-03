const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;

class Category extends Model {}

Category.init(
  {
    name: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'category', // table name
  }
);

module.exports = Category;
