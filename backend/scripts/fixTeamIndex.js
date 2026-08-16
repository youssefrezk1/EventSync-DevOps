// Run this script to fix the team name index issue
// Usage: node scripts/fixTeamIndex.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixTeamIndex() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const teamsCollection = mongoose.connection.db.collection('teams');
    
    // Get current indexes
    const indexes = await teamsCollection.indexes();
    console.log('\nCurrent indexes on teams collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
    });

    // Look for old teamName-only unique index
    const oldIndex = indexes.find(idx => 
      idx.key && 
      idx.key.teamName === 1 && 
      !idx.key.tournamentId && 
      idx.unique
    );

    if (oldIndex) {
      console.log(`\nFound old global teamName index: "${oldIndex.name}"`);
      console.log('Dropping this index...');
      await teamsCollection.dropIndex(oldIndex.name);
      console.log('✅ Successfully dropped old teamName index!');
    } else {
      console.log('\n✅ No old teamName-only unique index found. Index is correct.');
    }

    // Check if compound index exists
    const compoundIndex = indexes.find(idx =>
      idx.key &&
      idx.key.tournamentId === 1 &&
      idx.key.teamName === 1
    );

    if (compoundIndex) {
      console.log(`\n✅ Compound index exists: "${compoundIndex.name}"`);
    } else {
      console.log('\n⚠️  Compound index (tournamentId + teamName) not found.');
      console.log('Creating compound index...');
      await teamsCollection.createIndex(
        { tournamentId: 1, teamName: 1 },
        { unique: true }
      );
      console.log('✅ Created compound index!');
    }

    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixTeamIndex();
