"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.logout = exports.login = exports.otpVerification = exports.register = exports.googleAuth = void 0;
const userModel_1 = __importDefault(require("../../models/userModel"));
const error_1 = require("../../middlewares/error");
const setCookie_1 = __importDefault(require("../../utils/setCookie"));
const generateOTP_1 = __importDefault(require("../../utils/generateOTP"));
const crypto_1 = __importDefault(require("crypto"));
const sendMail_1 = require("../../utils/sendMail");
const otpModal_1 = __importDefault(require("../../models/otpModal"));
const axios_1 = __importDefault(require("axios"));
const googleAuth = async (req, res, next) => {
    try {
        const { access_token } = req.body;
        console.log(req.body, "hre is body");
        if (!access_token)
            return next(new error_1.CustomError("No access token provided", 400));
        // Verify the access token with Google
        const tokenInfoResponse = await axios_1.default.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`);
        const userInfoResponse = await axios_1.default.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`);
        const tokenInfo = tokenInfoResponse.data;
        const userData = userInfoResponse.data;
        if (!tokenInfo || !userData)
            return next(new error_1.CustomError("Invalid token", 401));
        const { email, name } = userData;
        if (!email)
            return next(new error_1.CustomError("Email not found", 404));
        const user = await userModel_1.default.findOne({ email });
        if (user) {
            // If user already exists then log in the user
            (0, setCookie_1.default)({
                user,
                res,
                next,
                message: "Login Success",
                statusCode: 200,
            });
        }
        else {
            // If user not found then create a new user
            const newUser = await userModel_1.default.create({
                name: name,
                email,
            });
            (0, setCookie_1.default)({
                user: newUser,
                res,
                next,
                message: "Registered successfully",
                statusCode: 201,
            });
        }
    }
    catch (error) {
        console.error(error);
        next(new error_1.CustomError("Authentication failed", 500));
    }
};
exports.googleAuth = googleAuth;
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await userModel_1.default.findOne({ email });
        if (user)
            return next(new error_1.CustomError("User already exists", 400));
        const OTP = (0, generateOTP_1.default)();
        await (0, sendMail_1.sendMail)({
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
        const hashedOTP = crypto_1.default.createHash("sha256").update(OTP).digest("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const existingOtpRecord = await otpModal_1.default.findOne({ email });
        if (existingOtpRecord) {
            existingOtpRecord.otp = hashedOTP;
            existingOtpRecord.expiresAt = expiresAt;
            existingOtpRecord.newUser = newUser;
            await existingOtpRecord.save();
        }
        else {
            const otpRecord = new otpModal_1.default({
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
    }
    catch (error) {
        console.log(error);
        next(new error_1.CustomError(error.message));
    }
};
exports.register = register;
const otpVerification = async (req, res, next) => {
    try {
        const { otp, email } = req.body;
        console.log(req.body);
        const otpRecord = await otpModal_1.default.findOne({ email });
        if (!otpRecord)
            return next(new error_1.CustomError("OTP not found", 404));
        const hashedOtp = crypto_1.default.createHash("sha256").update(otp).digest("hex");
        if (hashedOtp !== otpRecord.otp ||
            otpRecord.expiresAt < new Date(Date.now())) {
            return next(new error_1.CustomError("Invalid or expired OTP", 400));
        }
        const newUser = otpRecord.newUser;
        const user = await userModel_1.default.create(newUser);
        await otpModal_1.default.deleteOne({ email });
        (0, setCookie_1.default)({
            user,
            res,
            next,
            message: "Verification Success",
            statusCode: 200,
        });
    }
    catch (error) {
        console.log(error);
        next(new error_1.CustomError(error.message));
    }
};
exports.otpVerification = otpVerification;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await userModel_1.default.findOne({ email }).select("+password");
        if (!user)
            return next(new error_1.CustomError("Email not registered", 404));
        // Use the comparePassword method here
        const isMatched = await user.comparePassword(password);
        if (!isMatched)
            return next(new error_1.CustomError("Wrong password", 400));
        (0, setCookie_1.default)({
            user,
            res,
            next,
            message: "Login Success",
            statusCode: 200,
        });
    }
    catch (error) {
        console.log(error);
        next(new error_1.CustomError(error.message));
    }
};
exports.login = login;
const logout = async (req, res) => {
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
exports.logout = logout;
const getUser = async (req, res, next) => {
    try {
        const user = await userModel_1.default.findById(req.user._id);
        if (!user)
            return next(new error_1.CustomError("User not found", 400));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.getUser = getUser;
