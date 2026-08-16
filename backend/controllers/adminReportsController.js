import { RegisterBooth } from '../models/RegisterBooth.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { RegisterTrip } from '../models/RegisterTrip.js';
import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';
import { Bazaar } from '../models/Bazaar.js';
import { Vendor } from '../models/Vendor.js'; // Add this import
import mongoose from 'mongoose';

const WORKSHOP_FIXED_PRICE = process.env.WORKSHOP_FIXED_PRICE || 100;

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function handleError(res, err, context) {
  console.error(`${context} error:`, err);
  res.status(500).json({ success: false, message: `${context} error`, details: err.message });
}

async function getEventReport(eventModel, eventFieldName, eventType, filters) {
  const { name, fromDate, toDate } = filters;
  const aggregationPipeline = [
    { $match: { PaymentStatus: 'Paid' } },
    { $addFields: { [eventFieldName]: { $toObjectId: `$${eventFieldName}` } } },
    { $lookup: { from: `${eventType.toLowerCase()}s`, localField: eventFieldName, foreignField: '_id', as: 'event' } },
    { $unwind: '$event' },
    ...(name ? [{ $match: { 'event.name': { $regex: name, $options: 'i' } } }] : []),
    ...(fromDate && toDate ? [{
      $match: { 
        $and: [
          { 'event.start': { $lte: toDate } },
          // FIX: Check for both 'end' and 'endDate' fields
          { 
            $or: [
              { 'event.end': { $gte: fromDate } },
              { 'event.endDate': { $gte: fromDate } }
            ]
          }
        ]
      }
    }] : []),
    { $group: { _id: `$${eventFieldName}`, ticketsSold: { $sum: 1 }, event: { $first: '$event' } } },
  ];
  return await eventModel.aggregate(aggregationPipeline);
}

/* ===================== REVENUE ===================== */
export async function getRevenueReport(req, res) {
  try {
    const { type, name, from, to, sort = 'desc' } = req.query;
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    const details = [];
    const totalsByType = {};

    function pushDetail(eventType, eventId, eventName, revenue, count, start, end) {
      details.push({ 
        eventType, 
        eventId: eventId?.toString?.() || eventId, 
        eventName, 
        revenue, 
        count,
        start,
        end
      });
      totalsByType[eventType] = (totalsByType[eventType] || 0) + (revenue || 0);
    }

    // ---------- TRIPS ----------
    if (!type || type.toLowerCase() === 'trip') {
      const tripAgg = await getEventReport(RegisterTrip, 'TripName', 'Trip', { name, fromDate, toDate });
      for (const row of tripAgg) {
        const price = Number(row.event?.price || 0);
        const revenue = price * row.ticketsSold;
        pushDetail('Trip', row._id, row.event?.name, revenue, row.ticketsSold, row.event?.start, row.event?.end);
      }
    }

    // ---------- WORKSHOPS ----------
    if (!type || type.toLowerCase() === 'workshop') {
      const wsAgg = await getEventReport(RegisterWorkshop, 'WorkshopName', 'Workshop', { name, fromDate, toDate });
      for (const row of wsAgg) {
        const revenue = WORKSHOP_FIXED_PRICE * row.ticketsSold;
        pushDetail('Workshop', row._id, row.event?.name, revenue, row.ticketsSold, row.event?.start, row.event?.end);
      }
    }

    // ---------- BAZAARS ----------
    if (!type || type.toLowerCase() === 'bazaar') {
      const bazaarAgg = await RegisterBazaar.aggregate([
        { $match: { PaymentStatus: 'Paid' } },
        { $addFields: { BazaarName: { $toObjectId: '$BazaarName' } } },
        { $lookup: { from: 'bazaars', localField: 'BazaarName', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        ...(name ? [{ $match: { 'event.name': { $regex: name, $options: 'i' } } }] : []),
        ...(fromDate && toDate ? [{
          $match: { 
            $and: [
              { 'event.start': { $lte: toDate } },
              // FIX: Use 'endDate' for Bazaar
              { 'event.endDate': { $gte: fromDate } }
            ]
          }
        }] : []),
        { $group: { 
          _id: '$BazaarName',
          totalFees: { $sum: { $ifNull: ['$PaymentFees', 0] } },
          totalAttendees: { $sum: { $size: { $ifNull: ['$Attendees', []] } } },
          event: { $first: '$event' } 
        }}
      ]);
      
      for (const row of bazaarAgg) {
        // FIX: Use 'endDate' instead of 'end'
        pushDetail('Bazaar', row._id, row.event?.name, Number(row.totalFees || 0), row.totalAttendees, row.event?.start, row.event?.endDate);
      }
    }

    // ---------- BOOTHS ----------
    if (!type || type.toLowerCase() === 'booth') {
      const boothAgg = await RegisterBooth.aggregate([
        { $match: { PaymentStatus: 'Paid' } },
        // FIX: Add vendor lookup to get vendor name
        { $addFields: { VendorID: { $toObjectId: '$VendorID' } } },
        { $lookup: { from: 'vendors', localField: 'VendorID', foreignField: '_id', as: 'vendor' } },
        { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
        { $addFields: {
          // Calculate end date in aggregation pipeline
          calculatedEndDate: {
            $dateAdd: {
              startDate: '$StartDate',
              unit: 'week',
              amount: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$SetupDuration', '1 week'] }, then: 1 },
                    { case: { $eq: ['$SetupDuration', '2 weeks'] }, then: 2 },
                    { case: { $eq: ['$SetupDuration', '3 weeks'] }, then: 3 },
                    { case: { $eq: ['$SetupDuration', '4 weeks'] }, then: 4 }
                  ],
                  default: 0
                }
              }
            }
          }
        }},
        // Apply date filters if provided
        ...(fromDate && toDate ? [{
          $match: {
            $and: [
              { StartDate: { $lte: toDate } },
              { calculatedEndDate: { $gte: fromDate } }
            ]
          }
        }] : []),
        { $project: {
          fees: { $ifNull: ['$PaymentFees', 0] },
          attendeesCount: { $size: { $ifNull: ['$Attendees', []] } },
          vendorName: { $ifNull: ['$vendor.companyName', 'Unknown Vendor'] },
          startDate: '$StartDate',
          endDate: '$calculatedEndDate',
          VendorID: 1
        }}
      ]);
      
      for (const row of boothAgg) {
        // FIX: Use actual vendor name from lookup
        pushDetail('Booth', row._id, row.vendorName, Number(row.fees || 0), row.attendeesCount, row.startDate, row.endDate);
      }
    }

    const dir = sort === 'asc' ? 1 : -1;
    details.sort((a, b) => (a.revenue - b.revenue) * dir);
    const grandTotal = Object.values(totalsByType).reduce((s, v) => s + (v || 0), 0);

    res.status(200).json({ success: true, count: details.length, grandTotal, totalsByType, details });
  } catch (err) {
    handleError(res, err, 'Revenue');
  }
}

export async function getAttendeeReport(req, res) {
  try {
    const { type, name, from, to, sort = 'desc' } = req.query;

    // If no type is provided, default only Trip + Workshop
let enforcedType = type;
if (!type) {
  enforcedType = "trip,workshop";
}

// Support comma-separated types
const allowedTypes = enforcedType
  .split(",")
  .map(t => t.trim().toLowerCase());

  
    console.log('Attendee Report - From:', from, 'To:', to);
    
    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    const results = [];

    // ---------- TRIPS ----------
    if (allowedTypes.includes('trip'))
      {
      const trips = await RegisterTrip.aggregate([
        { $match: { PaymentStatus: 'Paid' } },
        { $addFields: { TripName: { $toObjectId: '$TripName' } } },
        { $lookup: { from: 'trips', localField: 'TripName', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        ...(name ? [{ $match: { 'event.name': { $regex: name, $options: 'i' } } }] : []),
        ...(fromDate && toDate ? [{
          $match: { 
            $and: [
              { 'event.start': { $lte: toDate } },
              { 'event.end': { $gte: fromDate } }
            ]
          }
        }] : []),
        { $group: { 
          _id: '$TripName', 
          ticketsSold: { $sum: 1 },
          event: { $first: '$event' } 
        }}
      ]);
      
      for (const t of trips) {
        results.push({
          eventType: 'Trip',
          eventId: t._id?.toString(),
          eventName: t.event?.name,
          attendeesCount: t.ticketsSold,
          start: t.event?.start,
          end: t.event?.end
        });
      }
    }

    // ---------- WORKSHOPS ----------
    if (allowedTypes.includes('workshop'))
      {
      const workshops = await RegisterWorkshop.aggregate([
        { $match: { PaymentStatus: 'Paid' } },
        { $addFields: { WorkshopName: { $toObjectId: '$WorkshopName' } } },
        { $lookup: { from: 'workshops', localField: 'WorkshopName', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        ...(name ? [{ $match: { 'event.name': { $regex: name, $options: 'i' } } }] : []),
        ...(fromDate && toDate ? [{
          $match: { 
            $and: [
              { 'event.start': { $lte: toDate } },
              { 'event.end': { $gte: fromDate } }
            ]
          }
        }] : []),
        { $group: { 
          _id: '$WorkshopName', 
          ticketsSold: { $sum: 1 },
          event: { $first: '$event' } 
        }}
      ]);
      
      for (const w of workshops) {
        results.push({
          eventType: 'Workshop',
          eventId: w._id?.toString(),
          eventName: w.event?.name,
          attendeesCount: w.ticketsSold,
          start: w.event?.start,
          end: w.event?.end
        });
      }
    }





    // Sort
    if (sort === 'asc') {
      results.sort((a, b) => a.attendeesCount - b.attendeesCount);
    } else if (sort === 'desc') {
      results.sort((a, b) => b.attendeesCount - a.attendeesCount);
    }

    // Calculate totals
    const totalsByType = results.reduce((acc, r) => {
      acc[r.eventType] = (acc[r.eventType] || 0) + r.attendeesCount;
      return acc;
    }, {});
    
    const grandTotal = results.reduce((sum, r) => sum + r.attendeesCount, 0);

    res.status(200).json({ 
      success: true, 
      totalsByType, 
      grandTotal, 
      results 
    });
  } catch (err) {
    handleError(res, err, 'Attendee');
  }
}