import UserModel, { User } from "../models/user.model.js";

export const DB_COLLECTION_NAME = {
  USER: "USER",
} as const;

export const DB_COLLECTION = {
  [DB_COLLECTION_NAME.USER]: UserModel,
} as const;

export type ModelTypeMap = {
  [DB_COLLECTION_NAME.USER]: User;
};
