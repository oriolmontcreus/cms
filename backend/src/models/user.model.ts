import { Document, Model, model, Schema } from "mongoose";
import * as bcrypt from "bcrypt";
import { User } from "@shared/types/user.type.ts";
import { Roles } from "@shared/constants/role.type.ts";

export type UserWithPassword = User & { password: string };

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export type IUserDocument = User & IUserMethods & Document;
type UserModel = Model<
  User,
  Record<string | number | symbol, never>,
  IUserMethods
>;

const userSchema = new Schema<UserWithPassword, UserModel, IUserMethods>({
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
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.method(
  "comparePassword",
  async function (password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  },
);

export const UserModel: UserModel = model<UserWithPassword, UserModel>(
  "User",
  userSchema,
);
