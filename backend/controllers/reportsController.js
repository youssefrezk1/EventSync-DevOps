// controllers/eventOfficeReportsController.js

import { RegisterBooth } from '../models/RegisterBooth.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { RegisterTrip } from '../models/RegisterTrip.js';
import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';
import { Bazaar } from '../models/Bazaar.js';
import mongoose from 'mongoose';

const WORKSHOP_FIXED_PRICE = 100;

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* ===================== REVENUE ===================== */
export async function getEventOfficeRevenueReport(req, res) {
  try {
    const { sort = 'desc' } = req.query;

    const details = [];
    const totalsByType = {};

    function pushDetail(eventType, eventId, eventName, revenue, count, start, end) {
      details.push({ eventType, eventId: eventId?.toString?.() || eventId, eventName, revenue, count, start, end });
      totalsByType[eventType] = (totalsByType[eventType] || 0) + (revenue || 0);
    }

    // ---------- TRIPS ----------
    const tripAgg = await RegisterTrip.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $addFields: { TripName: { $toObjectId: '$TripName' } } },
      { $lookup: { from: 'trips', localField: 'TripName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $group: { _id: '$TripName', ticketsSold: { $sum: 1 }, event: { $first: '$event' } } },
    ]);
    for (const row of tripAgg) {
      const price = Number(row.event?.price || 0);
      const revenue = price * row.ticketsSold;
      pushDetail('Trip', row._id, row.event?.name, revenue, row.ticketsSold, row.event?.start, row.event?.end);
    }

    // ---------- WORKSHOPS ----------
    const wsAgg = await RegisterWorkshop.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $addFields: { WorkshopName: { $toObjectId: '$WorkshopName' } } },
      { $lookup: { from: 'workshops', localField: 'WorkshopName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $group: { _id: '$WorkshopName', paidCount: { $sum: 1 }, event: { $first: '$event' } } },
    ]);
    for (const row of wsAgg) {
      const revenue = WORKSHOP_FIXED_PRICE * row.paidCount;
      pushDetail('Workshop', row._id, row.event?.name, revenue, row.paidCount, row.event?.start, row.event?.end);
    }

    // ---------- BAZAARS ----------
    const bazAgg = await RegisterBazaar.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $lookup: { from: 'bazaars', localField: 'BazaarName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      {
        $project: {
          BazaarName: 1,
          event: 1,
          fees: { $ifNull: ['$PaymentFees', 0] },
          attendeesCount: { $size: { $ifNull: ['$Attendees', []] } }
        }
      },
      { $group: { _id: '$BazaarName', totalFees: { $sum: '$fees' }, totalAttendees: { $sum: '$attendeesCount' }, event: { $first: '$event' } } },
    ]);
    for (const row of bazAgg) {
      pushDetail('Bazaar', row._id, row.event?.name, Number(row.totalFees || 0), row.totalAttendees, row.event?.start, row.event?.endDate);
    }

    // ---------- BOOTHS ----------
    const boothAgg = await RegisterBooth.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $project: {
          fees: { $ifNull: ['$PaymentFees', 0] },
          attendeesCount: { $size: { $ifNull: ['$Attendees', []] } },
          VendorID: 1,
          StartDate: 1,
          EndDate: 1
      }},
    ]);
    for (const row of boothAgg) {
      const vendorName = row.VendorID?.toString() || 'Unknown Vendor';
      pushDetail('Booth', row._id, vendorName, Number(row.fees || 0), row.attendeesCount, row.StartDate, row.EndDate);
    }

    const dir = sort === 'asc' ? 1 : -1;
    details.sort((a, b) => (a.revenue - b.revenue) * dir);
    const grandTotal = Object.values(totalsByType).reduce((s, v) => s + (v || 0), 0);

    res.status(200).json({ success: true, count: details.length, grandTotal, totalsByType, details });
  } catch (err) {
    console.error('Revenue error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/* ===================== ATTENDEES ===================== */
export async function getEventOfficeAttendeeReport(req, res) {
  try {
    const { sort = 'desc' } = req.query;

    const all = [];

    // ---------- TRIPS ----------
    const trips = await RegisterTrip.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $addFields: { TripName: { $toObjectId: '$TripName' } } },
      { $lookup: { from: 'trips', localField: 'TripName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
    ]);
    for (const t of trips) {
      all.push({
        eventType: 'Trip',
        eventId: t.TripName,
        eventName: t.event?.name,
        attendeesCount: 1,
        start: t.event?.start,
        end: t.event?.end,
      });
    }

    // ---------- WORKSHOPS ----------
    const workshops = await RegisterWorkshop.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $addFields: { WorkshopName: { $toObjectId: '$WorkshopName' } } },
      { $lookup: { from: 'workshops', localField: 'WorkshopName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
    ]);
    for (const w of workshops) {
      all.push({
        eventType: 'Workshop',
        eventId: w.WorkshopName,
        eventName: w.event?.name,
        attendeesCount: 1,
        start: w.event?.start,
        end: w.event?.end,
      });
    }

    // ---------- BAZAARS ----------
    const bazaars = await RegisterBazaar.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
      { $lookup: { from: 'bazaars', localField: 'BazaarName', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
    ]);
    for (const b of bazaars) {
      all.push({
        eventType: 'Bazaar',
        eventId: b.BazaarName,
        eventName: b.event?.name,
        attendeesCount: (b.Attendees || []).length,
        start: b.event?.start,
        end: b.event?.endDate,
      });
    }

    // ---------- BOOTHS ----------
    const booths = await RegisterBooth.aggregate([
      { $match: { PaymentStatus: 'Paid' } },
    ]);
    for (const b of booths) {
      all.push({
        eventType: 'Booth',
        eventId: b.VendorID,
        eventName: b.VendorID?.toString() || 'Unknown Vendor',
        attendeesCount: (b.Attendees || []).length,
        start: b.StartDate,
        end: b.EndDate,
      });
    }

    // Sort
    if (sort === 'asc') all.sort((a, b) => a.attendeesCount - b.attendeesCount);
    else all.sort((a, b) => b.attendeesCount - a.attendeesCount);

    const totalsByType = all.reduce((acc, r) => {
      acc[r.eventType] = (acc[r.eventType] || 0) + r.attendeesCount;
      return acc;
    }, {});
    const grandTotal = all.reduce((sum, r) => sum + r.attendeesCount, 0);

    res.status(200).json({ success: true, totalsByType, grandTotal, results: all });
  } catch (err) {
    console.error('Attendee error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
