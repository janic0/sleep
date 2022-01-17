import { model, models, Schema } from "mongoose";
import "../../db";

export interface dataPoint {
    _id: string;
    added: Date;
    value: number;
    user: string;
}

export default (models ? models["dataPoint"] : undefined) || model<dataPoint>("dataPoint", new Schema<dataPoint>({
    added: {
        type: Date,
        default: Date.now
    },
    value: {
        type: Number,
        required: true
    },
    user: {
        type: String,
        required: true
    }
}));