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

    if (!notes?.length) {
      return res.status(404).json({ message: "No notes found" });
    }

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
        select: "-password",
        model: User,
      })
      .lean();

    if (!note?.length) {
      return res.status(404).json({ message: "No note found" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req, res) => {
  const { username, title, description } = req.body;

  if (!username || !title || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const duplicate = await Note.findOne({ title }).lean().exec();

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate note title" });
    }

    const note = await Note.create({ username, title, description });

    if (note) {
      res.status(201).json({ message: "New note created" });
    } else {
      res.status(400).json({ message: "Invalid note data received" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = async (req, res) => {
  const { id } = req.params;
  
  const { username, title, description, completed } = req.body;

  if (!id || !username || !title || !description || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [note, duplicateNote] = await Promise.all([
      Note.findById(id).lean().exec(),
      Note.findOne({ title, _id: { $ne: id } })
        .lean()
        .exec(),
    ]);

    if (!note || duplicateNote) {
      return !note
        ? res.status(404).json({ message: "Note not found" })
        : res.status(409).json({ message: "Duplicate note title" });
    }

    const updateFields = {
      username,
      title,
      description,
      completed,
    };

    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedNote) {
      return res.status(400).json({ message: "Failed to update note" });
    }

    res.status(200).json({ message: `'${updatedNote.title}' updated` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }

  try {
    const note = await Note.findById(id).exec();

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const result = await note.deleteOne();

    res.status(200).json({
      message: `Note '${result.title}' with ID ${result._id} deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNewNote,
  updateNote,
  deleteNote,
};
