import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export { client };

export const DB_ID = 'compstudy-db';
export const COLLECTIONS = {
    PROFILES: 'profiles',
    ROOMS: 'rooms',
    ROOM_PARTICIPANTS: 'room_participants',
    DISCUSSIONS: 'discussions',
    GROUPS: 'groups',
    STUDY_SESSIONS: 'study_sessions'
};
