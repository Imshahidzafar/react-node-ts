import sequelize, { User } from "../models/index";
import { validate } from "class-validator"; // Import class-validator to perform validation

const insertAdminUser = async () => {
  try {
    await sequelize.authenticate(); // Establish database connection

    // Ensure table sync (use force: true if tables are empty)
    await sequelize.sync();

    // Admin user data
    const adminUserData = {
      name: "admin",
      email: "admin@gmail.com",
      password: "12345678",
      verified: true,
      role: "admin",
    };

    // Step 1: Validate the data using class-validator
    const userInstance = Object.assign(new User(), adminUserData);
    const errors = await validate(userInstance); // Validate the user instance

    if (errors.length > 0) {
      throw new Error(
        "Validation failed: " + errors.map((err) => err.toString()).join(", ")
      );
    }

    // Step 2: Create the admin user after successful validation
    const adminUser = await User.create(adminUserData);

    console.log("Admin user created:", adminUser.toJSON());
  } catch (error) {
    console.error("Error inserting admin user:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

insertAdminUser();
