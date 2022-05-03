const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/category/Category');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync(); // Initialize the database
});

beforeEach(() => {
  // clean the database before each test
  User.destroy({ truncate: true });
  return Category.destroy({ truncate: true });
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

const validCategory = {
  name: 'categoryOne',
  description: 'descriptionOne',
};

const postCategory = (category = validCategory) => {
  return request(app).post('/api/1.0/categories').send(category);
};

describe('category Registration', () => {
  it('returns 200 OK when post request is valid', async () => {
    const response = await postCategory();
    expect(response.status).toBe(200);
  });
  it('saves the caterory to database', async () => {
    await postCategory();
    // query category table to make assertions about it
    const categoryList = await Category.findAll();
    expect(categoryList.length).toBe(1);
  });
  it('saves the category name and description to database', async () => {
    await postCategory();
    // query category table to make assertions about it
    const categoryList = await Category.findAll();
    const savedCategory = categoryList[0];
    expect(savedCategory.name).toBe('categoryOne');
    expect(savedCategory.description).toBe('descriptionOne');
  });
  it('returns 400 when name is null', async () => {
    const response = await postCategory({
      name: null,
      description: 'someDescription',
    });
    expect(response.status).toBe(400);
  });
  it('returns 400 when description is null', async () => {
    const response = await postCategory({
      name: 'someName',
      description: null,
    });
    expect(response.status).toBe(400);
  });
  it('returns category is already in use', async () => {
    await Category.create({ ...validCategory });
    const response = await postCategory();
    expect(response.body.validationErrors.name).toBe('Category in use');
  });
  it('returns 400 when description is less then 10 characteres', async () => {
    const response = await postCategory({
      name: 'someName',
      description: 'abcde',
    });
    expect(response.status).toBe(400);
  });
});

describe('category Remotion', () => {
  it('return error when trying to remove a category by an unlogged user', async () => {
    await postUser();
    await postCategory();
    const userList = await User.findAll();
    const savedUser = userList[0];
    const categoryList = await Category.findAll();
    const savedCategory = categoryList[0];
    await request(app).post(`/api/1.0/categories/${savedCategory.id}`).send(savedUser);
    //expect(respose.status).toBe(400);
  });
});
