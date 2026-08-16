import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';
import { Bazaar } from '../models/Bazaar.js';
import { Confrence } from '../models/Confrence.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { Wir } from '../models/Wir.js';
import { 
  notifyWorkshopRequest,
  notifyWorkshopStatus,
  notifyNewEvent,
  notifyNewPartner,
  notifyVendorRequest,
} from '../controllers/notificationController.js';



// ===== WORKSHOP HOOKS =====
Workshop.schema.post('save', async function(doc) {
  try {
    // If it's a new workshop with pending status, notify events office
    if (this.isNew && doc.status === 'Pending') {
      await notifyWorkshopRequest(doc);
    }
  } catch (error) {
    console.error('Error in workshop post-save hook:', error);
  }
});

Workshop.schema.post('findOneAndUpdate', async function(doc) {
  try {
    if (!doc) return;
    
    // Get the update data to check if status changed
    const update = this.getUpdate();
    const statusChanged = update.status || update.$set?.status;
    
    if (statusChanged && (statusChanged === 'confirmed' || statusChanged === 'rejected')) {
      await notifyWorkshopStatus(doc, statusChanged);
    }
  } catch (error) {
    console.error('Error in workshop post-update hook:', error);
  }
});

// ===== BAZAAR HOOKS =====
Bazaar.schema.post('save', async function(doc) {
  try {
    if (this.isNew && !doc.isArchived) {
      await notifyNewEvent('Bazaar', doc);
    }
  } catch (error) {
    console.error('Error in bazaar post-save hook:', error);
  }
});

// ===== TRIP HOOKS =====
Trip.schema.post('save', async function(doc) {
  try {
    if (this.isNew && !doc.isArchived) {
      await notifyNewEvent('Trip', doc);
    }
  } catch (error) {
    console.error('Error in trip post-save hook:', error);
  }
});

// ===== CONFERENCE HOOKS =====
Confrence.schema.post('save', async function(doc) {
  try {
    if (this.isNew && !doc.isArchived) {
      await notifyNewEvent('Confrence', doc);
    }
  } catch (error) {
    console.error('Error in conference post-save hook:', error);
  }
});

// ===== REGISTER BOOTH HOOKS =====
RegisterBooth.schema.post('findOneAndUpdate', async function(doc) {
  try {
    if (!doc) return;
    
    const update = this.getUpdate();
    const pendingStatus = update.Pending || update.$set?.Pending;
    
    // Only notify when status changes to 'Accept' (newly accepted)
    if (pendingStatus === 'Accept' && !doc.isArchived) {
      // Check if this is a status change (not initial creation)
      const originalDoc = await RegisterBooth.findById(doc._id);
      if (originalDoc && originalDoc.Pending !== 'Accept') {
        await notifyNewEvent('RegisterBooth', doc);
      }
    }
  } catch (error) {
    console.error('Error in register booth post-update hook:', error);
  }
});

// Notify events office when new booth request is created
RegisterBooth.schema.post('save', async function(doc) {
  try {
    if (this.isNew && doc.Pending === 'Pending') {
      await notifyVendorRequest('RegisterBooth', doc);
    }
  } catch (error) {
    console.error('Error in register booth post-save hook:', error);
  }
});

// ===== REGISTER BAZAAR HOOKS =====
RegisterBazaar.schema.post('save', async function(doc) {
  try {
    if (this.isNew && doc.Pending === 'Pending') {
      await notifyVendorRequest('RegisterBazaar', doc);
    }
  } catch (error) {
    console.error('Error in register bazaar post-save hook:', error);
  }
});

// ===== WIR (LOYALTY PARTNER) HOOKS =====
Wir.schema.post('save', async function(doc) {
  try {
    if (this.isNew) {
      await notifyNewPartner(doc);
    }
  } catch (error) {
    console.error('Error in wir post-save hook:', error);
  }
});

console.log('✅ Notification hooks initialized');