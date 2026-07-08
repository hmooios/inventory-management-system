import httpStatus from 'http-status';
import asyncHandler from '../../lib/asyncHandler';
import sendResponse from '../../lib/sendResponse';
import userServices from './user.services';
import CustomError from '../../errors/customError';
import config from '../../config';

class UserControllers {
  private services = userServices;

  // get self profile
  getSelf = asyncHandler(async (req, res) => {
    const result = await this.services.getSelf(req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'User profile retrieved successfully!',
      data: result
    });
  });

  // register new account
  register = asyncHandler(async (req, res) => {
    const result = await this.services.register(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'User registered successfully!',
      data: result
    });
  });

  // login into your registered account
  login = asyncHandler(async (req, res) => {
    const result = await this.services.login(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User login successfully!',
      data: result
    });
  });

  // update profile
  updateProfile = asyncHandler(async (req, res) => {
    const result = await this.services.updateProfile(req.user._id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'User Profile updated successfully!',
      data: result
    });
  });

  // update profile picture
  updateProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new CustomError(httpStatus.BAD_REQUEST, 'Profile picture is required');
    }

    const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
    const baseUrl = (config.upload_base_url || requestBaseUrl).replace(/\/$/, '');
    const avatar = `${baseUrl}/uploads/profile/${req.file.filename}`;
    const result = await this.services.updateProfile(req.user._id, { avatar });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Profile picture updated successfully!',
      data: result
    });
  });

  // change Password
  changePassword = asyncHandler(async (req, res) => {
    const result = await this.services.changePassword(req.user._id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Password changed successfully!',
      data: result
    });
  });
}

const userControllers = new UserControllers();
export default userControllers;
