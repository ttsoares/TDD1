const Category = require('./Category');

const save = async (body) => {
  const { name, description } = body;
  const category = { name, description };
  await Category.create(category);
};

const findByName = async (name) => {
  return await Category.findOne({ where: { name: name } });
};

const deleteCategory = async (categoryId, userId) => {
  const categoryToBeDeleted = await Category.findOne({
    where: { id: categoryId, userId: userId },
  });
  if (!categoryToBeDeleted) {
    throw new Error('Category not found');
  }

  await categoryToBeDeleted.destroy();
};

module.exports = { save, findByName, deleteCategory };
