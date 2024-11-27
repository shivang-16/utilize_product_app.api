import { Request, Response, NextFunction } from "express";
import User from "../../models/userModel";
import { CustomError } from "../../middlewares/error";
import setCookie from "../../utils/setCookie";
import generateOTP from "../../utils/generateOTP";
import crypto from "crypto";
import { sendMail } from "../../utils/sendMail";
import OTPModel from "../../models/otpModal";
import axios from "axios";



export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { access_token } = req.body;
    console.log(req.body, "hre is body")
    if (!access_token)
      return next(new CustomError("No access token provided", 400));

    // Verify the access token with Google
    const tokenInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`,
    );
    const userInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`,
    );

    const tokenInfo = tokenInfoResponse.data;
    const userData = userInfoResponse.data;

    if (!tokenInfo || !userData)
      return next(new CustomError("Invalid token", 401));

    const { email, name } = userData;

    if (!email) return next(new CustomError("Email not found", 404));
    const user = await User.findOne({ email });
    if (user) {
      // If user already exists then log in the user
      setCookie({
        user,
        res,
        next,
        message: "Login Success",
        statusCode: 200,
      });
    } else {
      // If user not found then create a new user
      const newUser = await User.create({
        name: name,
        email,
      });

      setCookie({
        user: newUser,
        res,
        next,
        message: "Registered successfully",
        statusCode: 201,
      });
    }
  } catch (error) {
    console.error(error);
    next(new CustomError("Authentication failed", 500));
  }
};


export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) return next(new CustomError("User already exists", 400));

    const OTP = generateOTP();

    await sendMail({
      email,
      subject: "Verification",
      message: `Your otp for verifcation is ${OTP}`,
    });

    const newUser = {
      name,
      email,
      password,
    };

    // Save OTP and newUser data in the OTP model
    const hashedOTP = crypto.createHash("sha256").update(OTP).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existingOtpRecord = await OTPModel.findOne({ email });
    if (existingOtpRecord) {
      existingOtpRecord.otp = hashedOTP;
      existingOtpRecord.expiresAt = expiresAt;
      existingOtpRecord.newUser = newUser;
      await existingOtpRecord.save();
    } else {
      const otpRecord = new OTPModel({
        email,
        otp: hashedOTP,
        expiresAt,
        newUser,
      });
      await otpRecord.save();
    }

    res
      .status(200)
      .cookie("email", email, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        message: `Verification OTP sent to ${email}`,
      });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const otpVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { otp, email } = req.body;

    console.log(req.body)

    const otpRecord = await OTPModel.findOne({ email });
    if (!otpRecord) return next(new CustomError("OTP not found", 404));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (
      hashedOtp !== otpRecord.otp ||
      otpRecord.expiresAt < new Date(Date.now())
    ) {
      return next(new CustomError("Invalid or expired OTP", 400));
    }

    const newUser = otpRecord.newUser;
    const user = await User.create(newUser);
    await OTPModel.deleteOne({ email });

    setCookie({
      user,
      res,
      next,
      message: "Verification Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new CustomError("Email not registered", 404));

    // Use the comparePassword method here
    const isMatched = await user.comparePassword(password);
    if (!isMatched) return next(new CustomError("Wrong password", 400));

    setCookie({
      user,
      res,
      next,
      message: "Login Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      message: "Logged out",
    });
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new CustomError("User not found", 400));

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};
