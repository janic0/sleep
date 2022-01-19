import { model, models, Schema } from "mongoose";
import "../../db";

export interface groupType {
    _id: string;
    name: string;
    users: string[];
    invited: string[];
    owner: string;
}

export default (models ? models["group"] : undefined) || model<groupType>("group", new Schema<groupType>({
    name: String,
    users: {
        type: [String],
        default: []
    },
    invited: {
        type: [String],
        default: []
    },
    owner: String
}));