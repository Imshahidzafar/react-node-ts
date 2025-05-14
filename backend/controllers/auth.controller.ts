import { User } from "../models/index";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest, User as UserType } from "../types/user";
import { Op, Model as SequelizeModel } from "sequelize";
import emailService from "../services/email.service";
import emailTemplate from "../utils/emailTemplate";
import { ValidationError, AuthenticationError } from "../utils/errorHandler";

type UserModel = UserType & SequelizeModel;

dotenv.config();

const authController = {
  async sendConfirmationEmail(user: any) {
    try {
      const token = String(crypto.randomBytes(32).toString("hex"));
      const verificationUrl = `${process.env.BACKEND_API_URL}/auth/verify-email?token=${token}&email=${user.email}`;
      user.verificationToken = token;
      await user.save();

      const emailContent = emailTemplate.render("verification", {
        verificationUrl,
        currentYear: new Date().getFullYear().toString(),
      });

      await emailService.sendEmail(
        user.email,
        "Verify Your Email - Node App",
        emailContent
      );
    } catch (error: any) {
      throw new ValidationError(`Error sending email: ${error.message}`);
    }
  },

  register: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, email, password }: UserType = req.body;

      const user: UserModel | null = await User.findOne({ where: { email } });
      if (user) {
        throw new ValidationError("Email is already in use.");
      }

      const newUser: UserModel = await User.create({
        name: name,
        email,
        password,
      });

      await authController.sendConfirmationEmail(newUser);

      res.status(201).json({
        message:
          "Signed up successfully. Please check your email for verification.",
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  verifyEmail: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, email } = req.query;

      const user: UserModel | null = await User.findOne({
        where: { email, verificationToken: token },
      });

      if (!user) {
        const resendUrl = `${process.env.FRONTEND_URL}/resend-verification?email=${email}`;
        const errorPage = emailTemplate.render("verification-failed", {
          resendUrl,
          currentYear: new Date().getFullYear().toString(),
        });
        res.status(400).send(errorPage);
        return;
      }

      await user.update({
        verified: true,
        verificationToken: null,
      });
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  login: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password }: UserType = req.body;

      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }

      const user: UserModel | null = await User.findOne({
        where: { email },
      });

      if (!user || !user.password) {
        throw new AuthenticationError("Invalid email or password");
      }

      if (!user.verified) {
        throw new AuthenticationError("Please verify your email before log in");
      }

      const isMatch = await bcrypt.compare(
        password as string,
        user.password as string
      );

      if (!isMatch) {
        throw new AuthenticationError("Invalid email or password");
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: "7d" }
      );

      await user.update({ refreshToken });

      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        role: user.role,
        profileImage: user.profileImage,
      };

      res.status(200).json({
        message: "Login successful",
        user: userResponse,
        token,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  forgotPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { email }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${user.email}`;

      // Set token and expiry (1 hour)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      const emailContent = emailTemplate.render("password-reset", {
        resetUrl,
        currentYear: new Date().getFullYear().toString(),
      });

      await emailService.sendEmail(
        user.email,
        "Password Reset - Node App",
        emailContent
      );
      res.status(200).json({ message: "Password reset email sent" });
    } catch (error: any) {
      console.error("Error in forgotPassword:", error);
      next(error);
    }
  }) as RequestHandler,

  resetPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { token, email, newPassword }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({
        where: {
          email,
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: Date.now() },
        },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update password and clear reset fields
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      next(error);
    }
  }) as RequestHandler,

  resendVerification: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.verified) {
        return res.status(400).json({ message: "Account is already verified" });
      }

      await authController.sendConfirmationEmail(user);
      res.status(200).json({ message: "Verification email resent" });
    } catch (error) {
      console.error("Error in resendVerification:", error);
      next(error);
    }
  }) as RequestHandler,

  changePassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword }: UserType = req.body;
    const userId = (req as unknown as AuthenticatedRequest).user.id;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(
        currentPassword as string,
        user.password as string
      );
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error in changePassword:", error);
      next(error);
    }
  }) as RequestHandler,

  updateProfile: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { name, email, profileImage }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUserWithEmail: UserModel | null = await User.findOne({
          where: { email },
        });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }

      // Prepare update data
      const updateData: UserType = {
        name: name,
        email: email,
      };

      // Handle profile image if present
      if (profileImage) {
        const base64Data = profileImage.split(";base64,").pop();
        if (!base64Data) {
          return res.status(400).json({ message: "Invalid image data" });
        }
        // Generate unique filename
        const filename = `${Date.now()}-${userId}.png`;
        const filePath = `uploads/profiles/${filename}`;

        // Ensure directory exists
        if (!fs.existsSync("uploads/profiles")) {
          fs.mkdirSync("uploads/profiles", { recursive: true });
        }

        // Save the file
        fs.writeFileSync(filePath, base64Data as string, {
          encoding: "base64",
        });

        // Create the full URL for the profile image
        const imageUrl = `${process.env.BACKEND_BASE_URL}/${filePath}`;
        updateData.profileImage = imageUrl;
      }

      // Update user
      await user.update(updateData);

      // Return updated user data
      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          name: name,
          email: email,
          profileImage: profileImage,
          verified: user.verified,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      next(error);
    }
  }) as RequestHandler,

  verifyPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { password }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(
        password as string,
        user.password as string
      );

      res.status(200).json({
        isValid: isMatch,
        message: isMatch ? "Password is valid" : "Password is invalid",
      });
    } catch (error: any) {
      console.error("Error verifying password:", error);
      next(error);
    }
  }) as RequestHandler,
};

export default authController;
