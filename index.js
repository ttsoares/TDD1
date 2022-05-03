const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync({ force: true });
// This "force" is just for development and not production !!

app.listen(3000, () => console.log('app is running'));
