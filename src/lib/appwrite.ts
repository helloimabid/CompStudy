import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client };

export const DB_ID = 'compstudy-db';
export const BUCKET_ID = 'profile-pictures';
export const POST_IMAGES_BUCKET_ID = 'post-images';
export const BLOG_IMAGES_BUCKET_ID = 'blog-images';

export const COLLECTIONS = {
    PROFILES: 'profiles',
    ROOMS: 'rooms',
    ROOM_PARTICIPANTS: 'room_participants',
    DISCUSSIONS: 'discussions',
    GROUPS: 'groups',
    STUDY_SESSIONS: 'study_sessions',
    LIVE_SESSIONS: 'live_sessions',
    POSTS: 'posts',
    COMMENTS: 'comments',
    REACTIONS: 'reactions',
    CURRICULUM: 'curriculum',
    SUBJECTS: 'subjects',
    TOPICS: 'topics',
    PUBLIC_CURRICULUM: 'public_curriculum',
    CURRICULUM_RATINGS: 'curriculum_ratings',
    CONTACT_SUBMISSIONS: 'contact_submissions',
    VISITORS: 'visitors',
    NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers',
    BLOG_POSTS: 'blog_posts'
};
