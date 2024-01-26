import { User } from "../models/user.model.js";
import { ApiErrorHandle } from "./ApiErrorHandle.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import bcrypt from "bcrypt";


export const sendEmail = async ({ email, emailType, userId }) => {
  try {
    const hashToken = await bcrypt.hash(userId.toString(), 10);
    if (emailType === "VERIFY") {
      await User.findByIdAndUpdate(userId, {
        verifyToken: hashToken,
        verifyTokenExpiry: Date.now() + 300000,
      });
    }
      const config = {
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "b347b4d837dabf",
          pass: "1c02b835929e68"
        }
      };
      //   generate template for mail
      let mailGenerator = new Mailgen({
        theme: "salted",
        product: {
          name: "VideoVerse",
          link: "https://mailgen.js/",
          copyright: "Copyright © 2024 VideoVerse. All rights reserved.",
        },
      });
      let transporter = nodemailer.createTransport(config);
      let response = {
        body: {
          name:"Test",
          intro: [
            `Welcome to Test !`,
            "We're very excited to have you on board.",
          ],
          action: {
            instructions: `To get started with Test, please click here:`,
            button: {
              color: "#22BC66", // Optional action button color
              text: "Confirm your account",
              link: `http://localhost:3000/verifyToken?token=${hashToken}`,
            },
          },
          outro: "Looking Forward to do more business",
        },
      };
      let mail = mailGenerator.generate(response);
      let message = {
        from: process.env.EMAIL,
        to: email,
        subject: "Register to VideoVerse",
        html: mail,
      };
      const mailResponse = await transporter.sendMail(message);
      return mailResponse; 
  } catch (error) {
    throw new ApiErrorHandle(500, "Something Went Wrongs!");
  }
};
