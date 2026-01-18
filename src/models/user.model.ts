import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { DocumentType } from "@typegoose/typegoose";

export class User {
  @prop({ required: true })
  username: string;

  @prop()
  email: string;

  @prop({ required: true })
  password: string;

  @prop({ default: Date.now })
  createdAt: Date;

  @prop({ default: 1 })
  deleteFlag: number;

  @prop()
  deletedAt: Date;
}

const UserModel = getModelForClass(User);

export default UserModel;
