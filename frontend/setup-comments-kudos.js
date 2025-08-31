const { Client, Databases, ID } = require('appwrite');

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68b40f89000c10f4c303');

const databases = new Databases(client);
const DATABASE_ID = 'dartmaster_db';

async function setupCommentsAndKudos() {
  try {
    // Setup comments collection attributes
    console.log('Setting up comments collection attributes...');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
      'activityId',
      255,
      true
    );
    console.log('Created activityId attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
      'activityType',
      50,
      true
    );
    console.log('Created activityType attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
      'userId',
      255,
      true
    );
    console.log('Created userId attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
       'username',
      255,
      true
    );
    console.log('Created username attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
      'avatarUrl',
      500,
      false
    );
    console.log('Created avatarUrl attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_comments',
       'content',
      1000,
      true
    );
    console.log('Created content attribute');
    
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      'activity_comments',
      'createdAt',
      true
    );
    console.log('Created createdAt attribute');
    
    // Create kudos collection
    console.log('\nCreating kudos collection...');
    await databases.createCollection(
      DATABASE_ID,
      'activity_kudos',
      'Activity Kudos',
      ['read("any")', 'create("users")', 'delete("users")'],
      true
    );
    console.log('Created kudos collection');
    
    // Setup kudos collection attributes
    console.log('Setting up kudos collection attributes...');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_kudos',
      'activityId',
      255,
      true
    );
    console.log('Created activityId attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_kudos',
      'activityType',
      50,
      true
    );
    console.log('Created activityType attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_kudos',
      'userId',
      255,
      true
    );
    console.log('Created userId attribute');
    
    await databases.createStringAttribute(
      DATABASE_ID,
      'activity_kudos',
      'username',
      255,
      true
    );
    console.log('Created username attribute');
    
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      'activity_kudos',
      'createdAt',
      true
    );
    console.log('Created createdAt attribute');
    
    // Create indexes for efficient queries
    console.log('\nCreating indexes...');
    
    await databases.createIndex(
      DATABASE_ID,
      'activity_comments',
      'idx_activity',
      'key',
      ['activityId', 'createdAt'],
      ['ASC', 'DESC']
    );
    console.log('Created comments activity index');
    
    await databases.createIndex(
      DATABASE_ID,
      'activity_kudos',
      'idx_activity',
      'key',
      ['activityId'],
      ['ASC']
    );
    console.log('Created kudos activity index');
    
    await databases.createIndex(
      DATABASE_ID,
      'activity_kudos',
      'idx_user_activity',
      'key',
      ['userId', 'activityId'],
      ['ASC', 'ASC']
    );
    console.log('Created kudos user-activity index');
    
    console.log('\n✅ Comments and kudos collections setup complete!');
    
  } catch (error) {
    console.error('Error setting up collections:', error);
  }
}

setupCommentsAndKudos();