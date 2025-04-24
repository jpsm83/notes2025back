// imported models
const Note = require("../models/Note");
const User = require("../models/User");

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate({
        path: "userId",
        select: "-password",
        model: User,
      })
      .lean();

    if (!notes || notes.length === 0) {
      return res.status(404).json({ message: "No notes found!" });
    }

    return res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({
      message: "An error occurred while fetching notes",
      error: error.message,
    });
  }
};

// @desc Get a note by ID
// @route GET /notes/:id
// @access Private
const getNoteById = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await Note.findById(id)
      .populate({
        path: "userId",
        select: "username",
        model: User,
      })
      .lean();

    if (!note) {
      return res.status(404).json({ message: "No note found!" });
    }

    return res.status(200).json(note);
  } catch (error) {
    console.error("Error fetching note!", error);
    return res.status(500).json({
      message: "An error occurred while fetching note!",
      error: error.message,
    });
  }
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res) => {
  const { dueDate, title, description, priority, userId } = req.body;

  if (!dueDate || !userId || !title || !description) {
    return res
      .status(400)
      .json({ message: "All fields except 'priority' are required!" });
  }

  try {
    const duplicate = await Note.findOne({ title, userId }).lean();

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate note title!" });
    }

    const noteObj = {
      dueDate,
      userId,
      title,
      description,
      priority: priority || undefined,
    };

    const newNote = await Note.create(noteObj);

    if (newNote) {
      return res.status(201).json({ message: "New note created" });
    } else {
      return res.status(400).json({ message: "Failed to create new note!" });
    }
  } catch (error) {
    console.error("Error creating note!", error);
    return res.status(500).json({
      message: "An error occurred while creating note",
      error: error.message,
    });
  }
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
  const { id } = req.params;

  const { dueDate, title, description, priority, completed } = req.body;

  if (
    !id ||
    !dueDate ||
    !title ||
    !description ||
    typeof priority !== "boolean" ||
    typeof completed !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    const note = await Note.findById(id).lean();

    if (!note) {
      return res.status(404).json({ message: "Note not found!" });
    }

    const duplicate = await Note.findOne({
      title,
      userId: note.userId,
      _id: { $ne: id },
    }).lean();

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate note title!" });
    }

    const updateFields = {};

    if (dueDate !== note.dueDate) updateFields.dueDate = dueDate;
    if (title !== note.title) updateFields.title = title;
    if (description !== note.description)
      updateFields.description = description;
    if (priority !== note.priority) updateFields.priority = priority;
    if (completed !== note.completed) updateFields.completed = completed;

    // No changes? Return early
    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({ message: "No changes detected" });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedNote) {
      return res.status(400).json({ message: "Failed to update note!" });
    }

    return res.status(200).json({ message: `${updatedNote.title} - updated` });
  } catch (error) {
    console.error("Error updating note!", error);
    return res.status(500).json({
      message: "An error occurred while updating note!",
      error: error.message,
    });
  }
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Note ID is required!" });
  }

  try {
    // Try deleting the note directly
    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ message: "Note not found!" });
    }

    // Respond with deleted note details
    return res.status(200).json({
      message: `Note with ID ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the note!",
      error: error.message,
    });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNewNote,
  updateNote,
  deleteNote,
};
