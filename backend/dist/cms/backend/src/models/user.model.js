import { model, Schema } from "mongoose";
import * as bcrypt from "bcrypt";
import { Roles } from "@shared/constants/role.type.js";
const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    permissions: { type: Number, default: Roles.CLIENT },
    name: { type: String, default: "" },
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc, ret) {
            delete ret.password;
            return ret;
        },
    },
});
userSchema.pre("save", async function () {
    if (!this.isModified("password"))
        return;
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
});
userSchema.method("comparePassword", async function (password) {
    return await bcrypt.compare(password, this.password);
});
export const UserModel = model("User", userSchema);
