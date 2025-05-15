import express from "express";
const router = express.Router();

import { getAllNotes, createNewNote, getNoteById, updateNote, deleteNote, getNoteByUserId } from "../controllers/notesController.js";
import verifyJWT from "../middleware/verifyJWT.js";

// jwt middleware will execute before any other route handler
// this way we can protect all routes in this file with the same middleware
router.use(verifyJWT);

router
  .route("/")
  .get(getAllNotes)
  .post(createNewNote);

router
  .route("/:id")
  .get(getNoteById)
  .patch(updateNote)
  .delete(deleteNote);

router.route("/user/:id").get(getNoteByUserId);

export default router;
