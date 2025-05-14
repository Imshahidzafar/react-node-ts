import { Router, Request, Response, NextFunction } from "express";
import { sequelize } from "../models/index";
import initUserModel from "../models/user";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { UserUpdateRequest } from "../types/user";

const User = initUserModel(sequelize);

class UserController {
  async getUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request<{ id: string }, {}, UserUpdateRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userInstance = plainToClass(User, req.body);
      const errors = await validate(userInstance);
      if (errors.length > 0) {
        res.status(400).json({ error: errors[0].constraints });
        return;
      }

      await user.update(req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      await user.destroy();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
