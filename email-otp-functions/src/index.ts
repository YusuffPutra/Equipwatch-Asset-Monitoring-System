import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: functions.config().email.user, // Replace with sender email
        pass: functions.config().email.pass, // Replace with app password
    },
});

// Define the structure of the input data
interface OtpRequest {
  email: string;
}

// Define the structure of the response
interface OtpResponse {
  success: boolean;
  message: string;
}

export const sendEmailOtp = functions.https.onCall(
    async (request: functions.https.CallableRequest): Promise<OtpResponse> => {
        const {email} = request.data as OtpRequest;
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

        try {
        // Save OTP to Firestore with expiration time
            await admin.firestore().collection("emailOtps").doc(email).set({
                otp,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // 5 mins
            });

            // Send OTP via email
            await transporter.sendMail({
                from: functions.config().email.user,
                to: email,
                subject: "Your Login OTP",
                text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
            });

            return {success: true, message: "Email OTP sent successfully!"};
        } catch (error) {
            console.error("Error sending email OTP:", error);
            throw new functions.https.HttpsError("internal", "Failed to send email OTP.");
        }
    }
);

export const verifyEmailOtp = functions.https.onCall(
    async (request: functions.https.CallableRequest): Promise<OtpResponse> => {
        const {email, otp} = request.data as { email: string; otp: string };

        try {
            const otpDoc = await admin.firestore().collection("emailOtps").doc(email).get();

            // Check if OTP document exists
            if (!otpDoc.exists) {
                throw new Error("No OTP found for this email.");
            }

            const otpData = otpDoc.data();
            if (!otpData) {
                throw new Error("Invalid OTP data.");
            }

            const {otp: storedOtp, expiresAt} = otpData;
            const now = admin.firestore.Timestamp.now();

            // Verify OTP and expiration time
            if (storedOtp === otp && now < expiresAt) {
                return {success: true, message: "Email OTP verified!"};
            } else {
                throw new Error("Invalid or expired OTP.");
            }
        } catch (error) {
            console.error("Error verifying email OTP:", error);
            throw new functions.https.HttpsError("internal", "Failed to verify email OTP.");
        }
    }
);
