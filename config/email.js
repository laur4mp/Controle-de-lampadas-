const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lm5849353@gmail.com',      
        pass: 'geiy snlz mhqo ivdt'          
    }
});

module.exports = transporter;
