import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', 
    pass: 'your-password'         
  }
});

export const emailAdapter = {
  async sendConfirmationEmail(email: string, confirmationCode: string) {
    const html = `
      <h1>Thank for your registration</h1>
      <p>To finish registration please follow the link below:
         <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>
      </p>
    `;

    await transport.sendMail({
      from: '"Blog Platform" <your-email@gmail.com>',
      to: email,
      subject: 'Registration Confirmation',
      html
    });
  }
}; 