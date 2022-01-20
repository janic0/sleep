import { model, models, Schema } from "mongoose";
import "../../db";

export interface userType {
    _id: string;
    name: string;
    username: string;
    accessToken: string;
    apiKey: string;
    password: string;
    color: string;
}

export default (models ? models["user"] : undefined) || model<userType>("user", new Schema<userType>({
    name: String,
    username: String,
    password: String,
    apiKey: {
        type: String,
        default: ""
    },
    accessToken: String,
    color: {
        type: String,
        default: "red"
    }
}));