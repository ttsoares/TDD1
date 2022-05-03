const express = require('express');
const CategoryService = require('./CategoryService');
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.post(
  '/api/1.0/categories',
  check('name')
    .notEmpty()
    .withMessage('Name cannot be null')
    .bail() // do not proceed with next tests
    .isLength({ min: 4 })
    .withMessage('Must have min 4 characters')
    .bail()
    .custom(async (name) => {
      const category = await CategoryService.findByName(name);
      if (category) {
        throw new Error('Category in use');
      }
    }),
  check('description').notEmpty().withMessage('Description cannot be null').bail().isLength({ min: 10 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await CategoryService.save(req.body);
    return res.send({ message: 'Category created' });
  }
);

router.delete('/api/1.0/categories/:categoryId', async (req, res, next) => {
  try {
    await CategoryService.deleteCategory(req.params.categoryId, req.user);
    res.send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
