import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "6967221@gmail.com",
    pass: process.env.NODE_ENV,
  }
});


export const emailAdapter = {
  async sendConfirmationEmail(email: string, confirmationCode: string) {
    try {
      const html = `
        <h1>Thank for your registration</h1>
        <p>To finish registration please follow the link below:
          <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>
        </p>
      `;

      const result = await transport.sendMail({
        from: '"Blog Platform" <6967221@gmail.com>',
        to: email,
        subject: 'Registration Confirmation',
        html
      });

      console.log("Email sent successfully:", result);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  },

  async sendPasswordRecoveryEmail(email: string, recoveryCode: string) {
    try {
      const html = `
        <h1>Password Recovery</h1>
        <p>Recovery code: ${recoveryCode}</p>
      `;

      await transport.sendMail({
        from: '"Blog Platform" <6967221@gmail.com>',
        to: email,
        subject: 'Password Recovery',
        html
      });
    } catch (error) {
      console.error("Error sending recovery email:", error);
    }
  }
};
