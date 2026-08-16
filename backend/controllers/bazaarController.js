import { Bazaar } from "../models/Bazaar.js";
import { RegisterBazaar } from "../models/RegisterBazaar.js";
import { Vendor } from "../models/Vendor.js";

export async function getBazaarDetails(req, res) {
  try {
    const { id: bazaarId } = req.params;

    // 1) Get Bazaar Info
    const bazaar = await Bazaar.findById(bazaarId).select(
      "name start endDate time location shortDescription registrationDeadline"
    );

    if (!bazaar) {
      return res.status(404).json({ error: "Bazaar not found" });
    }

    // 2) Get accepted & paid vendors
    const registrations = await RegisterBazaar.find({
      BazaarName: bazaarId,
      Pending: "Accept",
      PaymentStatus: "Paid",
    }).populate({
      path: "VendorName",
      select: "companyName logo",
    });

    // 3) Extract vendors
    const vendors = registrations.map((reg) => ({
      companyName: reg.VendorName.companyName,
      logo: reg.VendorName.logo,
    }));

    // 4) Response
    return res.status(200).json({
      bazaar,
      registeredVendors: vendors,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteBazaar(req, res) {
  try {
    const { id: bazaarId } = req.params;

    // 1) Check if bazaar exists
    const bazaar = await Bazaar.findById(bazaarId);
    
    if (!bazaar) {
      return res.status(404).json({ error: "Bazaar not found" });
    }

    // 2) Check if any vendor is registered to this bazaar
    const registrationsCount = await RegisterBazaar.countDocuments({
      BazaarName: bazaarId,
    });

    if (registrationsCount > 0) {
      return res.status(400).json({ 
        error: "Cannot delete bazaar. There are vendors registered to this bazaar." 
      });
    }

    // 3) Delete the bazaar
    await Bazaar.findByIdAndDelete(bazaarId);

    return res.status(200).json({ 
      message: "Bazaar deleted successfully" 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
