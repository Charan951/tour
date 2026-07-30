import { Schema, model } from 'mongoose';

const permissionSchema = new Schema({
  module: { type: String, required: true },
  action: { type: String, required: true, enum: ['View', 'Create', 'Edit', 'Delete', 'Publish', 'Export'] },
  description: { type: String }
});

export const Permission = model('Permission', permissionSchema);

const roleSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      enum: ['Super Admin', 'Admin', 'Sales Executive', 'Content Manager', 'Marketing Executive'] 
    },
    description: { type: String },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystemRole: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Role = model('Role', roleSchema);
