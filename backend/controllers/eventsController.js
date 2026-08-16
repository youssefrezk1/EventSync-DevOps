import { Trip } from '../models/Trip.js';
import { Workshop } from '../models/Workshop.js';
import { Bazaar } from '../models/Bazaar.js';
import { Confrence } from '../models/Confrence.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { Staff } from '../models/Staff.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { json } from 'stream/consumers';

function formatAMPM(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

export async function getAllEvents(req, res, next) {
  try {
    const { search, type, location, date, sortBy = 'start', sortOrder = 'asc' } = req.query;
    const role = req.role;
    console.log("User role in getAllEvents:");

  let baseQuery = {};
  // Only show archived events to admin/event-office
  if (role !== 'admin' && role !== 'event-office') {
    baseQuery.isArchived = false;
  }
  const detectedType = detectEventType(search);
    // Search by name or professor name
  if (detectedType) {
  // remove ALL search filters except type filter
  delete baseQuery.$or;
} else if (search) {
  // 2️⃣ Only apply name/description search when no type keyword was found
  baseQuery.$or = [
    { name: { $regex: search, $options: 'i' } },
    { shortDescription: { $regex: search, $options: 'i' } }
  ];
}

    // Filter by location
    if (location) {
      baseQuery.location = { $regex: location, $options: 'i' };
    }

    // Filter by date range
    if (date) {
      const dateFilter = new Date(date);
      baseQuery.start = { $gte: dateFilter };
    }
    const now = new Date();
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

 if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (baseQuery.$or) {
    baseQuery = {...baseQuery,
      $and: [
        { $or: baseQuery.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    baseQuery.$or = restrictedFilter;
  }
}
    // Build per-type queries so we can apply role-based restrictions
    const tripsQuery = { ...baseQuery };
    const workshopsQuery = { ...baseQuery };
    const bazaarsQuery = { ...baseQuery };
    const conferencesQuery = { ...baseQuery };
    const boothsQuery = { ...baseQuery };

    // If the requester is NOT admin or event-office, restrict visible workshops/booths
    if (!(role === 'admin' || role === 'event-office')) {
      workshopsQuery.status = 'confirmed';
      boothsQuery.Pending = 'Accept';
    }
 

    // Fetch all event types in parallel using the per-type queries
    const [trips, workshops, bazaars, conferences, booths] = await Promise.all([
      Trip.find(tripsQuery).sort(sort).lean(),
      Workshop.find(workshopsQuery).populate('ProfCreator', 'firstName lastName').sort(sort).lean(),
      Bazaar.find(bazaarsQuery).sort(sort).lean(),
      Confrence.find(conferencesQuery).sort(sort).lean(),
      RegisterBooth.find(boothsQuery).populate('VendorID', 'companyName email logo').sort(sort).lean()
    ]);

    // Add event type to each item
    const allEvents = [
  ...trips.map(trip => ({ ...trip, eventType: "trip" })),

  ...workshops.map(workshop => ({
    ...workshop,
    eventType: "workshop",
    time:
      workshop.start && workshop.end
        ? `${formatAMPM(workshop.start)} - ${formatAMPM(workshop.end)}`
        : ""
  })),

  ...bazaars.map(bazaar => ({ ...bazaar, eventType: "bazaar" })),

  ...conferences.map(conference => ({ ...conference, eventType: "conference" })),

  // ⭐⭐⭐ BOOTH ADAPTATION — KEEP ALL ORIGINAL DATA BUT ADD BAZAAR-LIKE FIELDS ⭐⭐⭐
  ...booths.map(booth => ({
    ...booth,                       // keep original RegisterBooth values
    eventType: "booth",

    // Rename to match bazaar naming
    start: booth.StartDate || null,
    endDate: booth.EndDate || null,

    // unify location naming
    location: booth.Location || "",

    // Format time in AM–PM
    time:
      booth.StartDate && booth.EndDate
        ? `${formatAMPM(booth.StartDate)} `
        : ""
  }))
];

    // Sort all events together - archived events appear last
    allEvents.sort((a, b) => {
      // First sort by archived status (non-archived first)
      if (a.isArchived !== b.isArchived) {
        return a.isArchived ? 1 : -1;
      }
      // Then sort by date
      const aDate = new Date(a.start);
      const bDate = new Date(b.start);
      return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
    });
  

   let filteredEvents = allEvents;

   if (detectedType) {
  filteredEvents = filteredEvents.filter(e => e.eventType === detectedType);
}

    res.json(filteredEvents);
  } catch (err) {
    next(err);
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getEventsByType(req, res, next) {
  try {
   
    const { type } = req.params;
    const { search, location, faculty,date, sortBy = 'start', sortOrder = 'asc',professorName } = req.query;
    
  let query = {};
  // Only show archived events to admin/event-office
  if (req.role !== 'admin' && req.role !== 'event-office') {
    query.isArchived = false;
  }
    
    // Search by name or shortDescription
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }
  
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by date range
    if (date) {
      const dateFilter = new Date(date);
      query.start = { $gte: dateFilter };
    }
   if(faculty){
      query.facultyResponsible = faculty;
   }
    
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
     checkRestrictedField();
    let events = [];
    const now = new Date();
    switch (type) {
      case 'trips':
  if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (query.$or) {
    query = {...query,
      $and: [
        { $or: query.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    query.$or = restrictedFilter;
  }
} 
        events = await Trip.find(query).sort(sort).lean();
        break;
      case 'workshops': {
      
     if (professorName) {
  // exactly match the stored string (case-insensitive just in case)
  query.professorsParticipating = { 
    $regex: `^${escapeRegExp(professorName)}$`, 
    $options: "i" 
  };
}
        if (req.role !== "event-office" && req.role !== "admin") query.status = "confirmed";
        // If searching by prof name, need to lookup staff
        
        if (search) {
          // Try to find staff whose name matches search
          const staff = await Staff.find({
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } }
            ]
          })
          if (staff.length > 0) {
            const staffIds = staff.map(s => s._id);
            // Add to query for ProfCreator
            query.$or = query.$or || [];
            query.$or.push({ ProfCreator: { $in: staffIds } });
          }
        }
      
       if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (query.$or) {
    query = {
      ...query,
      $and: [
        { $or: query.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    query.$or = restrictedFilter;
  }
}
        events = await Workshop.find(query)
          .populate('ProfCreator', 'firstName lastName')
          .sort(sort)
          .lean();

          
        break;
        
      }
      
      case 'bazaars':
     
       if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (query.$or) {
    query = {...query,
      $and: [
        { $or: query.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    query.$or = restrictedFilter;
  }
}
        events = await Bazaar.find(query).sort(sort).lean();
        
        break;
      case 'conferences':
       
          
                 if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (query.$or) {
    query = {...query,
      $and: [
        { $or: query.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    query.$or = restrictedFilter;
  }
}
        events = await Confrence.find(query).sort(sort).lean();

        break;
      case 'booths':
        if (req.role !== "event-office" && req.role!=="admin") query.Pending = "Accept";
        
           if (req.role !== "event-office" && req.role !== "admin") {
  const roleMap = {
    Student: "student",
    TA: "TA",
    Staff: "Staff",
    Professor: "Professor"
  };

  const mappedRole = Object.entries(roleMap).find(
    ([key]) => key.toLowerCase() === req.role.toLowerCase()
  )?.[0] || req.role;

  // Build restrictedTo filter
  const restrictedFilter = [
    { restrictedTo: { $in: [mappedRole] } },
    { restrictedTo: { $exists: false } },
    { restrictedTo: { $size: 0 } }
  ];

  // Combine with search filter if it exists
  if (query.$or) {
    query = {...query,
      $and: [
        { $or: query.$or },           // search filter
        { $or: restrictedFilter }     // restrictedTo filter
      ]
    };
  } else {
    query.$or = restrictedFilter;
  }
}
        events = await RegisterBooth.find(query).populate('VendorID', 'companyName email logo').sort(sort).lean();
      
        break;
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }
    
    // Add event type to each item
    if(type!='workshops'){
    events = events.map(event => ({ ...event, eventType: type }));
    }
    else{
        events = events.map(event => ({ ...event, eventType: type, time:
      event.start && event.end
        ? `${formatAMPM(event.start)} - ${formatAMPM(event.end)}`
        : "" }));
    }
    res.json(events);
  } catch (err) {
    next(err);
  }
}




export async function getBazaarVendors(req, res, next) {
  try {
    const { bazaarId } = req.params;

    // 1️⃣ Find only accepted vendor registrations for this bazaar
    const acceptedRegistrations = await RegisterBazaar.find({
      BazaarName: bazaarId,
      Pending: "Accept", // ✅ only accepted vendors
    })
      .populate("VendorName", "companyName email logo status")
      .lean();

      
    // 2️⃣ Extract unique vendors (avoid duplicates)
    const uniqueVendorsMap = new Map();
    for (const registration of acceptedRegistrations) {
      const vendor = registration.VendorName;
      if (vendor && !uniqueVendorsMap.has(vendor._id.toString())) {
        uniqueVendorsMap.set(vendor._id.toString(), vendor);
      }
    }

    // 3️⃣ Convert to array for output
    const vendors = Array.from(uniqueVendorsMap.values());
    console.log("Vendors for Bazaar", bazaarId, ":", vendors);
    console.log("vendors logos", vendors.map(v => v.logo));

    res.status(200).json(vendors);
  } catch (err) {
    console.error("Error in getBazaarVendors:", err);
    next(err);
  }
}

export async function archiveEvent(req, res, next) {
  try {
    const { type, id } = req.params;
    const role = req.role;

    console.log('Archive request:', { type, id, role });

    if (role !== 'admin' && role !== 'event-office') {
      return res.status(403).json({ message: 'Only admin or event-office can archive events' });
    }

    const now = new Date();

    let model = null;
    let doc = null;

    switch (type) {
      case 'trips':
        model = Trip;
        doc = await Trip.findById(id);
        break;
      case 'workshops':
        model = Workshop;
        doc = await Workshop.findById(id);
        break;
      case 'bazaars':
        model = Bazaar;
        doc = await Bazaar.findById(id);
        break;
      case 'conferences':
        model = Confrence;
        doc = await Confrence.findById(id);
        break;
      case 'booths':
        model = RegisterBooth;
        doc = await RegisterBooth.findById(id);
        break;
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }

    if (!doc) {
      console.log('Document not found:', { type, id });
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Found document:', { type, id, hasEndDate: !!doc.EndDate, hasEndDateLower: !!doc.endDate, hasEnd: !!doc.end, hasStart: !!doc.start });

    // Determine event end time candidate fields for each type
    let endTime = null;
    if (type === 'booths') {
      endTime = doc.EndDate || doc.endDate || doc.end;
    } else {
      endTime = doc.end || doc.endDate || doc.EndDate || doc.start;
    }

    if (!endTime) {
      console.log('No end time found for document:', { type, id, doc });
      return res.status(400).json({ message: 'Event has no end/start date to determine archival eligibility' });
    }

    const eventEnd = new Date(endTime);
    if (isNaN(eventEnd.getTime())) {
      console.log('Invalid date:', { endTime, eventEnd });
      return res.status(400).json({ message: 'Invalid event date' });
    }

    console.log('Date check:', { eventEnd, now, isPast: eventEnd < now });

    if (eventEnd > now) {
      return res.status(400).json({ message: 'Event has not yet passed and cannot be archived' });
    }

    // Mark archived
    doc.isArchived = true;
    await doc.save();

    console.log('Successfully archived:', { type, id });
    return res.status(200).json({ message: 'Event archived' });
  } catch (err) {
    console.error('Error in archiveEvent:', err);
    return res.status(500).json({ message: err.message || 'Failed to archive event' });
  }
}

export async function unarchiveEvent(req, res, next) {
  try {
    const { type, id } = req.params;
    const role = req.role;

    console.log('Unarchive request:', { type, id, role });

    if (role !== 'admin' && role !== 'event-office') {
      return res.status(403).json({ message: 'Only admin or event-office can unarchive events' });
    }

    let model = null;
    let doc = null;

    switch (type) {
      case 'trips':
        model = Trip;
        doc = await Trip.findById(id);
        break;
      case 'workshops':
        model = Workshop;
        doc = await Workshop.findById(id);
        break;
      case 'bazaars':
        model = Bazaar;
        doc = await Bazaar.findById(id);
        break;
      case 'conferences':
        model = Confrence;
        doc = await Confrence.findById(id);
        break;
      case 'booths':
        model = RegisterBooth;
        doc = await RegisterBooth.findById(id);
        break;
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }

    if (!doc) {
      console.log('Document not found for unarchive:', { type, id });
      return res.status(404).json({ message: 'Event not found' });
    }

    // Mark unarchived
    doc.isArchived = false;
    await doc.save();

    console.log('Successfully unarchived:', { type, id });
    return res.status(200).json({ message: 'Event unarchived' });
  } catch (err) {
    console.error('Error in unarchiveEvent:', err);
    return res.status(500).json({ message: err.message || 'Failed to unarchive event' });
  }
}

// Get all archived events (admin and event-office only)
export async function getArchivedEvents(req, res, next) {
  try {
    const role = req.role;

    // Only admin and event-office can view archived events
    if (role !== 'admin' && role !== 'event-office') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch all archived events from all types
    const [trips, workshops, bazaars, conferences, booths] = await Promise.all([
      Trip.find({ isArchived: true }).sort({ start: -1 }).lean(),
      Workshop.find({ isArchived: true })
        .populate('ProfCreator', 'firstName lastName')
        .sort({ start: -1 })
        .lean(),
      Bazaar.find({ isArchived: true }).sort({ endDate: -1 }).lean(),
      Confrence.find({ isArchived: true }).sort({ endDate: -1 }).lean(),
      RegisterBooth.find({ isArchived: true })
        .populate('VendorID', 'companyName email logo')
        .sort({ EndDate: -1 })
        .lean()
    ]);

    // Add event type to each item
    const allArchivedEvents = [
      ...trips.map(trip => ({ ...trip, eventType: 'trip' })),
      ...workshops.map(workshop => ({ ...workshop, eventType: 'workshop' })),
      ...bazaars.map(bazaar => ({ ...bazaar, eventType: 'bazaar' })),
      ...conferences.map(conference => ({ ...conference, eventType: 'conference' })),
      ...booths.map(booth => ({ ...booth, eventType: 'booth' }))
    ];

    // Sort by start/end date (most recent first)
    allArchivedEvents.sort((a, b) => {
      const aDate = new Date(a.start || a.endDate || a.EndDate);
      const bDate = new Date(b.start || b.endDate || b.EndDate);
      return bDate - aDate;
    });

    res.json(allArchivedEvents);
  } catch (err) {
    next(err);
  }
}

const TYPE_KEYWORDS = {
  trip: ['trip', 'trips'],
  workshop: ['workshop', 'workshops'],
  bazaar: ['bazaar', 'bazaars'],
  conference: ['conference', 'conferences', 'conf'],
  booth: ['booth', 'booths', 'vendor', 'booths registration']
};

function detectEventType(search) {
  if (!search) return null;

  const term = search.toLowerCase();

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(k => term.includes(k))) {
      return type; // 'trip' | 'workshop' | ...
    }
  }
  return null;
}
async function checkRestrictedField() {
  try {
    // Find trips that have the 'restrictedTo' field
    const withRestricted = await Trip.find({ restrictedTo: { $exists: true } }).lean();
    console.log(`Trips WITH 'restrictedTo': ${withRestricted.length}`);
    console.log(withRestricted.map(t => ({ name: t.name, restrictedTo: t.restrictedTo })));

    // Find trips that do NOT have the 'restrictedTo' field
    const withoutRestricted = await Trip.find({ restrictedTo: { $exists: false } }).lean();
    console.log(`Trips WITHOUT 'restrictedTo': ${withoutRestricted.length}`);
    console.log(withoutRestricted.map(t => t.name));
  } catch (err) {
    console.error('Error checking restrictedTo field:', err);
  }
}