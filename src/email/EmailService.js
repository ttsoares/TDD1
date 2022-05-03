const transporter = require('../config/emailTransporter');

const sendAccountActivation = async (email, token) => {
  await transporter.sendMail({
    from: 'My app <info@my-app.com>',
    to: email,
    Subject: 'Account acctivation',
    html: `Token is ${token}`,
  });
};

module.exports = { sendAccountActivation };
