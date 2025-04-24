const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const verifyJWT = require('../middleware/verifyJWT')

// Route for creating a new user (does not require JWT)
router.route('/')
    .post(usersController.createNewUser);

// jwt middleware will execute before any other route handler
// this way we can protect all routes in this file with the same middleware
router.use(verifyJWT)

router.route('/')
    .get(usersController.getAllUsers)

router.route('/:id')
    .get(usersController.getUserById)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router
