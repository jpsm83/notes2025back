import express from 'express';
const router = express.Router();

import { login, refresh, logout, getMe } from '../controllers/authController.js';
import loginLimiter from '../middleware/loginLimiter.js';
import verifyJWT from '../middleware/verifyJWT.js';

router.route('/') // login route
  .post(loginLimiter, login);

router.route('/refresh')
  .get(refresh);

router.route('/logout')
  .post(logout);

router.route('/me')
  .get(verifyJWT, getMe);

export default router;
