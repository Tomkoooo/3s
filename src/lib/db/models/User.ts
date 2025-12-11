import { Schema, models, model, type Document, type Model } from "mongoose";

export interface IUser {
    email: string;
    fullName: string;
    role: 'auditor' | 'fixer' | 'admin';
    hashedPassword: string;
    createdAt: Date;
    passwordChangedAt: Date;
    lastLoginAt: Date;
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['auditor', 'fixer', 'admin'],
        default: 'auditor',
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    passwordChangedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lastLoginAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
})

// Email unique index - csak egy helyen
userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = IUser & Document;

const UserModel = (models.User as Model<IUser>) || model<IUser>('User', userSchema);

export default UserModel;