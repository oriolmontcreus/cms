import { Document, Model, model, Schema } from "mongoose";
import * as bcrypt from "bcrypt";
import { User } from "@shared/types/user.type.js";
import { Roles } from "@shared/constants/role.type.js";
import * as crypto from "crypto";

export type UserWithPassword = User & { password: string };

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateSetupToken(): string;
  isSetupTokenValid(): boolean;
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
    required: function (this: UserWithPassword) {
      return this.isInitialized;
    },
    select: false,
  },
  permissions: { type: Number, default: Roles.CLIENT },
  name: { type: String, default: "" },
  isInitialized: { type: Boolean, default: false },
  setupToken: {
    type: String,
    select: false,
    index: { sparse: true }
  },
  setupTokenExpires: {
    type: Date,
    select: false
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret) {
      delete ret.password;
      delete ret.setupToken;
      delete ret.setupTokenExpires;
      return ret;
    },
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return; // Skip if no password (uninitialized user)

  const salt = await bcrypt.genSalt(8);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.method(
  "comparePassword",
  async function (password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
  },
);

userSchema.method(
  "generateSetupToken",
  function (): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.setupToken = crypto.createHash('sha256').update(token).digest('hex');
    this.setupTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    return token;
  },
);

userSchema.method(
  "isSetupTokenValid",
  function (): boolean {
    return !!(this.setupToken && this.setupTokenExpires && this.setupTokenExpires > new Date());
  },
);

export const UserModel: UserModel = model<UserWithPassword, UserModel>(
  "User",
  userSchema,
);
