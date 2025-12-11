import { Schema, models, model, Document, ObjectId, Model } from "mongoose";

export type ISite = {
    name: string;
    children?: ObjectId[];  // Több child lehet
    checks?: ObjectId[];    // Checks is optional
    parentId?: ObjectId;    // Parent site reference a könnyebb queryért
    level: number;          // 0, 1, 2 (3 szint)
}

const siteSchema = new Schema<ISite>({
    name: {
        type: String,
        required: true,
    },
    children: {
        type: [Schema.Types.ObjectId],
        ref: "Site",
        required: false,
    },
    checks: {
        type: [Schema.Types.ObjectId],
        ref: "Check",
        required: false,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "Site",
        required: false,
    },
    level: {
        type: Number,
        required: true,
        min: 0,
        max: 2,
        default: 0,
    }
})

// Indexek a gyors queryért
siteSchema.index({ parentId: 1 });
siteSchema.index({ level: 1 });

// Validáció: children és checks nem létezhetnek egyszerre
siteSchema.pre('save', function (next) {
    if (this.children && this.children.length > 0 && this.checks && this.checks.length > 0) {
        return next(new Error('A területnek vagy alterületei, vagy ellenőrzései lehetnek, de mindkettő egyszerre nem!'));
    }
    
    // Level szerint validálás
    if (this.level === 0 && this.checks && this.checks.length > 0) {
        return next(new Error('Az első szintű területeknek mindig alterületei vannak, nem lehetnek ellenőrzései!'));
    }
    
    if (this.level === 2 && this.children && this.children.length > 0) {
        return next(new Error('A harmadik szintű területeknek mindig ellenőrzései vannak, nem lehetnek további alterületei!'));
    }
    
    next();
});

export type SiteDocument = ISite & Document;

const SiteModel = (models.Site as Model<ISite>) || model<ISite>('Site', siteSchema);

export default SiteModel;