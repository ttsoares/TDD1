const User = require('./User');
var sha1 = require('sha1');
const crypto = require('crypto');
const EmailService = require('../email/EmailService');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await sha1(`${username}${password}`);
  const user = { username, email, password: hash, activationToken: generateToken(16) };
  await User.create(user);
  await EmailService.sendAccountActivation(email, user.activationToken);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

const loggedIn = async (obj) => {
  const username = obj.body.dataValues.username;
  const password = obj.body.dataValues.password;

  const foundUser = await User.findOne({ where: { username: username } });
  if (!foundUser) {
    throw new Error('User not found');
  }
  const hashDB = sha1(`${foundUser.username}${foundUser.password}`);
  const hashFE = sha1(`${username}${password}`);

  if (hashDB === hashFE) {
    foundUser.logged = true;
    await foundUser.save();
  }
};

module.exports = { save, findByEmail, loggedIn };
