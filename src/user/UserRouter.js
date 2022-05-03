const express = require('express');
const UserService = require('./UserService');
const router = express.Router();
const { check, validationResult } = require('express-validator');

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail() // do not proceed with next tests
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters'),
  check('email')
    .notEmpty()
    .withMessage('E-mail cannot be null')
    .bail()
    .isEmail()
    .withMessage('E-mail is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('E-mail in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  }
);

router.post('/api/1.0/users/login', async (req, res) => {
  try {
    await UserService.loggedIn(req);
    res.send('User is logged');
  } catch (err) {
    throw new Error(err);
  }
});

module.exports = router;
