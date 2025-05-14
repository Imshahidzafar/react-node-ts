import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  currentPassword?: string;
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  token?: string;
  newPassword?: string;
  role?: string;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface UserDeleteRequest {
  id: string;
}

export interface UserGetRequest {
  id: string;
}

export interface UserJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: "user" | "admin";
}

export interface AuthenticatedRequest extends Request {
  user: UserJwtPayload;
}
