const sdk = require('node-appwrite');

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('6955d513000fca8bf0d3')
    .setKey('standard_da39ec3c3df2312f77974919569e99f48c45912c29db9cc7111ce117a7a57b427cbd6e9a83751d5108fb2f93f4029b064b7b2a3a0130d279360fe036b6bb3612826218947953e25bad289c6993af9faeeeb7dedafb319840dcababc2f8cc0ad8b0401ddb2f29f9a6f44b6741ad3c1471286f6e8d60b5a3f28f255fadb1448d6d');

const DB_ID = 'compstudy-db';
const COLLECTION_ID = 'room_participants';

async function createRoomParticipantsCollection() {
    try {
        console.log('Creating room_participants collection...');

        // Create collection
        try {
            await databases.createCollection(
                DB_ID,
                COLLECTION_ID,
                'Room Participants'
            );
            console.log('✓ Created room_participants collection');
        } catch (error) {
            if (error.code === 409) {
                console.log('- room_participants collection already exists');
            } else {
                throw error;
            }
        }

        // Wait a bit for collection to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add roomId attribute
        try {
            await databases.createStringAttribute(
                DB_ID,
                COLLECTION_ID,
                'roomId',
                50,
                true
            );
            console.log('✓ Added roomId attribute');
        } catch (error) {
            if (error.code === 409) {
                console.log('- roomId already exists');
            } else {
                console.error('Error adding roomId:', error.message);
            }
        }

        // Add userId attribute
        try {
            await databases.createStringAttribute(
                DB_ID,
                COLLECTION_ID,
                'userId',
                100,
                true
            );
            console.log('✓ Added userId attribute');
        } catch (error) {
            if (error.code === 409) {
                console.log('- userId already exists');
            } else {
                console.error('Error adding userId:', error.message);
            }
        }

        // Add username attribute
        try {
            await databases.createStringAttribute(
                DB_ID,
                COLLECTION_ID,
                'username',
                100,
                true
            );
            console.log('✓ Added username attribute');
        } catch (error) {
            if (error.code === 409) {
                console.log('- username already exists');
            } else {
                console.error('Error adding username:', error.message);
            }
        }

        // Add joinedAt attribute
        try {
            await databases.createDatetimeAttribute(
                DB_ID,
                COLLECTION_ID,
                'joinedAt',
                true
            );
            console.log('✓ Added joinedAt attribute');
        } catch (error) {
            if (error.code === 409) {
                console.log('- joinedAt already exists');
            } else {
                console.error('Error adding joinedAt:', error.message);
            }
        }

        console.log('\n⏳ Waiting for attributes to be available...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create indexes
        try {
            await databases.createIndex(
                DB_ID,
                COLLECTION_ID,
                'roomId_index',
                'key',
                ['roomId'],
                ['asc']
            );
            console.log('✓ Created roomId index');
        } catch (error) {
            if (error.code === 409) {
                console.log('- roomId index already exists');
            } else {
                console.error('Error creating roomId index:', error.message);
            }
        }

        try {
            await databases.createIndex(
                DB_ID,
                COLLECTION_ID,
                'userId_index',
                'key',
                ['userId'],
                ['asc']
            );
            console.log('✓ Created userId index');
        } catch (error) {
            if (error.code === 409) {
                console.log('- userId index already exists');
            } else {
                console.error('Error creating userId index:', error.message);
            }
        }

        console.log('\n✅ room_participants collection setup complete!');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

createRoomParticipantsCollection();
