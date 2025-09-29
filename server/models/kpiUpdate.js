import mongoose from "mongoose";

const kpiUpdateSchema = new mongoose.Schema(
  {
    kpi_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KPI",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { 
      type: String, 
      required: true 
    }, 
    changes: { 
      type: Object 
    }, // เก็บ { field: [old, new] }
    comment: { 
      type: String 
    },
  },
  { timestamps: true }
);

const KPIUpdate = mongoose.model("KPIUpdate", kpiUpdateSchema);

export default KPIUpdate;
