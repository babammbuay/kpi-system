import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,

    target_value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ["unit", "bath", "people", "percentage"],
      default: "unit",
    },
    actual_value: {
      type: Number,
      default: null,
    },

    status_kpi: {
      type: String,
      enum: ["On Track", "At Risk", "Off Track", null],
      default: null,
    },

    status_task: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started", // ✅ default
    },

    assigned_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    start_date: {
      type: Date,
      required: true,
    },

    end_date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const KPI = mongoose.model("KPI", kpiSchema);

export default KPI;
