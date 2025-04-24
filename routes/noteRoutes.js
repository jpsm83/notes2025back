const express = require('express')
const router = express.Router()
const notesController = require('../controllers/notesController')
const verifyJWT = require('../middleware/verifyJWT')

// jwt middleware will execute before any other route handler
// this way we can protect all routes in this file with the same middleware
router.use(verifyJWT)

router.route('/')
    .get(notesController.getAllNotes)
    .post(notesController.createNewNote)

    router.route('/:id')
    .get(notesController.getNoteById)
    .patch(notesController.updateNote)
    .delete(notesController.deleteNote)

module.exports = router