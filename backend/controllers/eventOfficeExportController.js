import ExcelJS from "exceljs";
import { RegisterTrip } from "../models/RegisterTrip.js";
import { RegisterWorkshop } from "../models/RegisterWorkshop.js";
import { Trip } from "../models/Trip.js";
import { Workshop } from "../models/Workshop.js";

export async function exportRegistrations(req, res) {
  try {
    const { type, id } = req.params;

    if (!["trip", "workshop"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Use 'trip' or 'workshop'" });
    }

    let registrations, eventInfo;
    console.log("Export type:", type);
    console.log("Event ID:", id);

    if (type === "trip") {
      // Query by the event ID reference, not name
      registrations = await RegisterTrip.find({ TripName: id });
      eventInfo = await Trip.findById(id);
    } else {
      // Query by the event ID reference, not name
      registrations = await RegisterWorkshop.find({ WorkshopName: id });
      eventInfo = await Workshop.findById(id);
    }

    if (!eventInfo) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!registrations || registrations.length === 0) {
      return res.status(404).json({ error: "No registrations found for this event" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");

    // Add header row with styling
    const headerRow = sheet.addRow([
      "Name",
      "Email",
      "Student ID",
      "Staff ID",
      "Payment Status",
      "Registered At"
    ]);

    // Style header row
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Add data rows
    registrations.forEach((reg) => {
      sheet.addRow([
        reg.Name || "",
        reg.Email || "",
        reg.StudentID || "",
        reg.StaffID || "",
        reg.PaymentStatus || "",
        reg.createdAt ? new Date(reg.createdAt).toLocaleString() : ""
      ]);
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Set response headers for file download
    const fileName = `${type}-${eventInfo.name.replace(/\s+/g, '-')}-registrations.xlsx`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Write to response and end
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: "Failed to export registrations", details: err.message });
  }
}