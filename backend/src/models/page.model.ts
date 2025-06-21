import { Document, Model, model, Schema, Types } from "mongoose";

export interface IPage {
  title: string;
  slug: string;
  content?: string;
  formData?: Record<string, any>; // JSON data from form submissions (for migration)
  config?: Record<string, any>; // Form configuration
  components?: Array<{
    componentName: string;
    instanceId: string;
    displayName?: string;
    formData: Record<string, any>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPageDocument extends IPage, Document {
  _id: Types.ObjectId;
}

type PageModel = Model<IPageDocument>;

const pageSchema = new Schema<IPageDocument>({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  content: {
    type: String,
    default: "",
  },
  formData: {
    type: Schema.Types.Mixed,
    default: {},
  },
  config: {
    type: Schema.Types.Mixed,
    default: {},
  },
  components: [{
    componentName: { type: String, required: true },
    instanceId: { type: String, required: true },
    displayName: String,
    formData: { type: Schema.Types.Mixed, default: {} }
  }]
}, {
  timestamps: true,
});

export const PageModel: PageModel = model<IPageDocument>("Page", pageSchema);

pageSchema.pre("save", async function() {
  if (this.isModified("slug")) {
    // Check if a page with this slug already exists
    const existingPage = await PageModel.findOne({ slug: this.slug });
    if (existingPage && !existingPage._id.equals(this._id)) {
      throw new Error("Page with this slug already exists");
    }
  }
}); 