import mongoose from "mongoose";
import { UserModel } from "../src/models/user.model.js";
var Roles;
(function (Roles) {
    Roles[Roles["CLIENT"] = 1] = "CLIENT";
    Roles[Roles["DEVELOPER"] = 3] = "DEVELOPER";
    Roles[Roles["SUPER_ADMIN"] = 7] = "SUPER_ADMIN"; // 7
})(Roles || (Roles = {}));
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/froggy";
console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
async function createUser(email, password, name, permissions = Roles.SUPER_ADMIN) {
    try {
        await mongoose.connect(MONGODB_URI);
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            console.error("User with this email already exists");
            process.exit(1);
        }
        // Use the Mongoose model to create the user (triggers pre-save hooks)
        const user = await UserModel.create({
            email,
            password,
            name,
            permissions,
        });
        console.log(`User created successfully with ID: ${user._id}`);
    }
    catch (error) {
        console.error("Error creating user:", error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
    }
}
// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.error("Usage: npm run create-user <email> <password> <name> [permissions]");
    process.exit(1);
}
let [email, password, ...rest] = args;
let name = rest.slice(0, rest.length - 1).join(" ");
let permissionsArg = rest[rest.length - 1];
// If permissionsArg is not a number, treat it as part of the name
let permissions;
if (permissionsArg && !isNaN(Number(permissionsArg))) {
    permissions = Number(permissionsArg);
}
else if (permissionsArg && Object.keys(Roles).includes(permissionsArg)) {
    permissions = Roles[permissionsArg];
    name = rest.join(" ");
}
else {
    permissions = Roles.SUPER_ADMIN;
    name = rest.join(" ");
}
// Clean up email and name
email = email.trim().replace(/,+$/, "");
name = name.trim().replace(/,+$/, "");
createUser(email, password, name, permissions);
