import nodeMailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix __dirname for ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Updated sendEmail to render EJS template
const sendEmail = async ({ email, subject, template, templateData }) => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        service: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Path to the EJS template
    const templatePath = path.join(__dirname, "../mail", template);

    // Render the EJS template with provided data
    const htmlContent = await ejs.renderFile(templatePath, templateData);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html: htmlContent, // Set HTML content instead of text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
};

export { sendEmail };