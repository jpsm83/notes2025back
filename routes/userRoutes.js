import express from 'express';
const router = express.Router()

import { createNewUser, getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController.js';
import verifyJWT from '../middleware/verifyJWT.js';

// Route for creating a new user (does not require JWT)
router.route('/')
    .post(createNewUser);

// jwt middleware will execute before any other route handler
// this way we can protect all routes in this file with the same middleware
router.use(verifyJWT)

router.route('/')
    .get(getAllUsers)

router.route('/:id')
    .get(getUserById)
    .patch(updateUser)
    .delete(deleteUser)

export default router
