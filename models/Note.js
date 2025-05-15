// mongoose is a mongodb library that help to create models easyer and faster
import mongoose from "mongoose";
import mongooseSequence from "mongoose-sequence";

const AutoIncrement = mongooseSequence(mongoose);

const noteSchema = new mongoose.Schema(
  {
    dueDate: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
      maxlength: [40, "Title cannot be more than 40 characters"],
      unique: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: [200, "Description cannot be more than 200 characters"],
    },
    priority: {
      type: Boolean,
      default: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true, // indexing references is a performance optimization, speed queries that frequently filter by this field
    },
  },
  {
    timestamps: true,
    trim: true,
  }
);

noteSchema.plugin(AutoIncrement, {
  inc_field: "ticket",
  id: "ticketNums",
  start_seq: 500,
});

export default mongoose.model("Note", noteSchema);
