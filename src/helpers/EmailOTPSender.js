import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create a transporter object using Gmail's SMTP server with TLS
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: true,
    requireTLS: true, 
    auth: {
      user: process.env.NODE_MAILER_EMAIL, 
      pass: process.env.PASSWORD , 
    },
  
  });
};

// Function to send an OTP email
export const sendOTPEmail = async (email, otp) => {
  console.log("inside the sendOTP",process.env.NODE_MAILER_EMAIL,process.env.PASSWORD)
  // Define the mail options (the email content)
  const mailOptions = {
    from: process.env.NODE_MAILER_EMAIL,  
    to: email,  
    subject: 'Your OTP', 
    text: `Your OTP code is ${otp}`,  
  };
  const transporter = createTransporter();
  try {
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.responseCode === 534) {
      console.error('Authentication failed. Please check your email and app password.');
    }
  }
};
