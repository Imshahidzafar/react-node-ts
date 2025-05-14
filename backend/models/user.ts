import { DataTypes, Model, Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import {
  IsString,
  IsEmail,
  Length,
  IsEnum,
  IsBoolean,
  validate,
  IsOptional,
  IsDate,
  IsNumber,
} from "class-validator";
import { plainToClass } from "class-transformer";

export default function initUserModel(sequelize: Sequelize) {
  class User extends Model {
    @IsString()
    @Length(1, 255)
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @Length(6, 100)
    password!: string;

    @IsEnum(["user", "admin"])
    role!: "user" | "admin";

    @IsBoolean()
    @IsOptional()
    verified!: boolean;

    @IsString()
    @IsOptional()
    verificationToken?: string;

    @IsString()
    @IsOptional()
    resetPasswordToken?: string;

    @IsDate()
    @IsOptional()
    resetPasswordExpires?: Date;

    @IsString()
    @IsOptional()
    otp?: string;

    @IsDate()
    @IsOptional()
    otpExpiry?: Date;

    @IsString()
    @IsOptional()
    profileImage?: string;

    // Add a hook to hash the password before saving
    static async hashPassword(user: User) {
      if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }

    // Method to check password validity
    async isValidPassword(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password);
    }

    // Custom validation logic
    static async validateUser(userData: Partial<User>) {
      const userInstance = plainToClass(User, userData);
      const errors = await validate(userInstance);
      if (errors.length > 0) {
        throw new Error(
          "Validation failed: " + errors.map((err) => err.toString()).join(", ")
        );
      }
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value: string) {
          this.setDataValue("password", value);
        },
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        allowNull: false,
        defaultValue: "user",
        validate: {
          isIn: [["user", "admin"]],
        },
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otpExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      hooks: {
        beforeSave: User.hashPassword,
      },
      paranoid: true,
    }
  );

  User.addHook("beforeCreate", async (user: User) => {
    await User.validateUser(user);
  });

  User.addHook("beforeUpdate", async (user: User) => {
    await User.validateUser(user);
  });

  return User;
}