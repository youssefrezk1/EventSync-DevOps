
import { sendAttendanceCertificate , sendPaymentReceiptCardEmail,sendQRcodeforVisitorsBazaar, sendQRcodeforVisitorsBooth, sendExternalQrCodeBazaar, sendExternalQrCodeBooth} from "../utils/emailService.js";


export const sendCertificate = async (req, res) => {
  try {
    const { studentName,
  bazaarName,
  professorName,
  startDate,
  endDate,
  campus,
  email} = req.body;

    if (!studentName || !bazaarName || !professorName || !startDate || !endDate || !campus || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate and send the certificate
    await sendAttendanceCertificate({
  studentName,
  bazaarName,
  professorName,
  startDate,
  endDate,
  campus,
  email,
});

    res.status(200).json({ message: "Certificate sent successfully." });
  } catch (error) {
    console.error("Error sending certificate:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const sendPayment = async (req, res) => {
  try {
    const { userName, lastFourDigits, amount, email, eventName, date, methodOfPayment} = req.body;

    if (!userName || !lastFourDigits || !amount || !email || !eventName || !date || !methodOfPayment) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate and send the certificate
    await sendPaymentReceiptCardEmail(
      userName,
      lastFourDigits,
      amount,
      email,
      eventName,
      date,
      methodOfPayment
    );

    res.status(200).json({ message: "Payment receipt sent successfully." });
  } catch (error) {
    console.error("Error sending payment receipt:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}; 

export const sendQrCode = async (req, res) => {
  try {
    const { companyName, photoURL, firstname, bazaarDetails, email} = req.body;
    if (!companyName || !photoURL || !firstname || !bazaarDetails || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate and send the certificate
    await sendQRcodeforVisitorsBazaar(
      companyName,
      photoURL,
      firstname,
      bazaarDetails,
      email
    );
    res.status(200).json({ message: "QR Code sent successfully." });
  } catch (error) {
    console.error("Error sending QR Code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendQrCodeBooth = async (req, res) => {
  try {
    const { companyName, firstname, boothDetails, email, photoURL} = req.body;
    if (!companyName || !firstname || !boothDetails || !email || !photoURL) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate and send the certificate
    await sendQRcodeforVisitorsBooth(
      companyName,
      firstname,
      boothDetails,
      email,
      photoURL
    );
    res.status(200).json({ message: "QR Code for Booth sent successfully." });
  } catch (error) {
    console.error("Error sending QR Code for Booth:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendQrCodeExternal = async (req, res) => {
  try {
    const { firstname, bazaarDetails, email} = req.body;
    if (!firstname || !bazaarDetails || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate and send the certificate
    await sendExternalQrCodeBazaar(
     email,
      bazaarDetails,
      firstname
    );
    res.status(200).json({ message: "QR Code for External Visitor sent successfully." });
  } catch (error) {
    console.error("Error sending QR Code for External Visitor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendQrCodeExternal2 = async (req, res) => {
  try {
    const { firstname, boothDetails, companyName, email} = req.body;
    
    if(!firstname ){
      return res.status(400).json({ message: "All fields are required1." });
    }
    if(!boothDetails){
      return res.status(400).json({ message: "All fields are required2." });
    }
    if(!companyName){
      return res.status(400).json({ message: "All fields are required3." });
    }
    if(!email){
      return res.status(400).json({ message: "All fields are required4." });
    }
    // Generate and send the certificate
    await sendExternalQrCodeBooth(
     email,
     boothDetails,
     companyName,
     firstname
    );
    res.status(200).json({ message: "QR Code for External Visitor to Booth sent successfully." });
  } catch (error) {
    console.error("Error sending QR Code for External Visitor to Booth:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};