// Run this script to fix existing paid sponsorship applications
// Usage: node scripts/fixSponsors.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixSponsors() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Find all paid but pending sponsorship applications
    const apps = await db.collection('sponsorshipapplications')
      .find({ paymentStatus: 'Paid', status: 'Pending' })
      .toArray();
    
    console.log(`\nFound ${apps.length} paid but pending applications to fix\n`);
    
    let fixed = 0;
    for (const app of apps) {
      // Get vendor for logo
      const vendor = await db.collection('vendors').findOne({ _id: app.vendorId });
      const logoUrl = vendor?.logo?.[0]?.url || '';
      const companyName = vendor?.companyName || 'Unknown Vendor';
      
      // Get tournament
      const tournament = await db.collection('tournaments').findOne({ _id: app.tournamentId });
      const tournamentName = tournament?.name || 'Unknown Tournament';
      
      // Check if already sponsor
      const alreadySponsor = tournament?.sponsors?.some(
        s => s.sponsorId?.toString() === app.vendorId.toString()
      );
      
      if (!alreadySponsor && tournament) {
        // Add to sponsors
        await db.collection('tournaments').updateOne(
          { _id: app.tournamentId },
          { 
            $push: { 
              sponsors: { 
                sponsorId: app.vendorId, 
                tier: app.proposedTier || 'Standard', 
                logoUrl: logoUrl 
              } 
            } 
          }
        );
        console.log(`  ✅ Added "${companyName}" as sponsor to "${tournamentName}" (${app.proposedTier || 'Standard'} tier)`);
      } else if (alreadySponsor) {
        console.log(`  ⏭️  "${companyName}" already a sponsor of "${tournamentName}"`);
      }
      
      // Update application status to Approved
      await db.collection('sponsorshipapplications').updateOne(
        { _id: app._id },
        { $set: { status: 'Approved' } }
      );
      
      fixed++;
    }
    
    console.log(`\n✅ Done! Fixed ${fixed} applications`);
    
    // Show updated tournaments
    console.log('\n--- Updated Tournaments with Sponsors ---');
    const tournaments = await db.collection('tournaments').find({}).toArray();
    for (const t of tournaments) {
      if (t.sponsors && t.sponsors.length > 0) {
        console.log(`\n${t.name}: ${t.sponsors.length} sponsor(s)`);
        for (const s of t.sponsors) {
          const v = await db.collection('vendors').findOne({ _id: s.sponsorId });
          console.log(`  - ${v?.companyName || 'Unknown'} (${s.tier})`);
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixSponsors();
