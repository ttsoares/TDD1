const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const nodemailerStub = require('nodemailer-stub');
var sha1 = require('sha1');

beforeAll(() => {
  return sequelize.sync(); // Initialize the database
});

beforeEach(() => {
  // clean the database before each test
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: '1qazxsw2',
  logged: false,
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('user Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });
  //
  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });
  //
  it('saves the user to database', async () => {
    await postUser();
    // query user table to make assertions about it
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });
  //
  it('saves the username and email to database', async () => {
    await postUser();
    // query user table to make assertions about it
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });
  //
  it('hashes the password in database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('1qazxsw2');
  });
  //
  it('login by test credentials', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    const hash = await sha1(`${validUser.username}${validUser.password}`);
    expect(savedUser.password).toBe(hash);
    expect(savedUser.username).toBe(validUser.username);
  });
  it('activate logged_in state', async () => {
    await postUser();
    let userList = await User.findAll();
    let savedUser = userList[0];
    await request(app).post('/api/1.0/users/login').send(savedUser);
    userList = await User.findAll();
    savedUser = userList[0];
    expect(savedUser.logged).toBeTruthy;
  });

  //---------------------------------------------------------------
  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: '1qazxsw2',
    });
    expect(response.status).toBe(400);
  });
  //
  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: '1qazxsw2',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });
  //
  it('returns errors when both username and e-mail are null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: '1qazxsw2',
    });
    const body = response.body;

    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
    // If the keys in the object are numbers the Object.keys function
    //   will sort them so the order will be changed.
    // If numbers and strings are mixed the strings will be at the end of the array.
  });
  //

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'E-mail cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'E-mail is not valid'}
    ${'email'}    | ${'user.mail.com'} | ${'E-mail is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'E-mail is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'abcde'}         | ${'Password must be at least 6 characters long'}
  `('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: '1qazxsw2',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });
  //
  it('returns E-mail in use when same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('E-mail in use');
  });
  //
  it('returns errors for username is null and email in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
  it('create user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });
  //
  it('create user in inactive mode even if the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });
  //
  it('creates an activation token for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });
  it('Sends an Account activation email with activationToken', async () => {
    await postUser();
    const lastMail = nodemailerStub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe('user1@mail.com');
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail.content).toContain(savedUser.activationToken);
  });
});
