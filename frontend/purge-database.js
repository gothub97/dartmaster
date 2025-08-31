import { Client, Databases, Query } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Collections to purge
const collections = [
  'matches',
  'match_states', 
  'match_history',
  'practice_sessions',
  'user_profiles',
  'friendships',
  'achievements',
  'user_achievements',
  'challenges'
];

async function purgeCollection(collectionId) {
  console.log(`\n🗑️  Purging collection: ${collectionId}`);
  
  try {
    let hasMore = true;
    let deletedCount = 0;
    
    while (hasMore) {
      // Fetch documents in batches
      const response = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        [Query.limit(100)]
      );
      
      if (response.documents.length === 0) {
        hasMore = false;
        break;
      }
      
      // Delete each document
      for (const doc of response.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
          deletedCount++;
          process.stdout.write(`\r  Deleted ${deletedCount} documents...`);
        } catch (error) {
          console.error(`\n  ❌ Error deleting document ${doc.$id}:`, error.message);
        }
      }
      
      // If we got less than 100 documents, we're done
      if (response.documents.length < 100) {
        hasMore = false;
      }
    }
    
    console.log(`\n  ✅ Deleted ${deletedCount} documents from ${collectionId}`);
    
  } catch (error) {
    console.error(`  ❌ Error accessing collection ${collectionId}:`, error.message);
  }
}

async function purgeDatabase() {
  console.log('🚨 DATABASE PURGE UTILITY');
  console.log('========================');
  console.log(`Database ID: ${DATABASE_ID}`);
  console.log(`Project: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
  console.log('\n⚠️  WARNING: This will delete ALL documents from ALL collections!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Starting purge...');
  
  for (const collection of collections) {
    await purgeCollection(collection);
  }
  
  console.log('\n');
  console.log('=================================');
  console.log('✅ Database purge complete!');
  console.log('=================================');
  console.log('\nAll collections have been emptied.');
  console.log('The database structure (collections and attributes) remains intact.');
}

// Run the purge
purgeDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});