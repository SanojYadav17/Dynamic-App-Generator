import mongoose, { Schema, Document } from 'mongoose';

interface IGeneratedRun extends Document {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  status: string;
  configJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MongoDB Schema for Generated Runs
 * Stores app configurations and metadata
 */
const runSchema = new Schema<IGeneratedRun>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'LIVE', 'ARCHIVED'],
      default: 'DRAFT',
    },
    configJson: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Create or retrieve Run model
 * Handles case where model already exists (prevents recompilation errors)
 */
export const Run =
  mongoose.models.Run || mongoose.model<IGeneratedRun>('Run', runSchema);

export type { IGeneratedRun };
