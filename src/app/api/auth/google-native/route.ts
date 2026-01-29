import { NextRequest, NextResponse } from 'next/server';
import { Client, Account, Users, ID } from 'node-appwrite';

// Initialize Appwrite Admin SDK for server-side operations
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || ''); // Server-side API key

const users = new Users(client);

interface GoogleTokenPayload {
    sub: string; // Google user ID
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
    iat: number;
    exp: number;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload | null> {
    try {
        // Verify the token with Google's API
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );

        if (!response.ok) {
            console.error('Google token verification failed:', await response.text());
            return null;
        }

        const payload = await response.json() as GoogleTokenPayload;

        // Verify the token is for your app (check audience/client ID)
        // You may want to add additional validation here

        return payload;
    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { idToken, email, name } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            );
        }

        // Verify the Google ID token
        const googlePayload = await verifyGoogleIdToken(idToken);

        if (!googlePayload) {
            return NextResponse.json(
                { error: 'Invalid Google ID token' },
                { status: 401 }
            );
        }

        // Check if email matches (additional security)
        if (email && googlePayload.email !== email) {
            return NextResponse.json(
                { error: 'Email mismatch' },
                { status: 401 }
            );
        }

        const userEmail = googlePayload.email;
        const userName = name || googlePayload.name || userEmail.split('@')[0];

        let appwriteUser;

        // Try to find existing user by email
        try {
            const usersList = await users.list([
                `equal("email", ["${userEmail}"])`
            ]);

            if (usersList.users.length > 0) {
                appwriteUser = usersList.users[0];
            }
        } catch (error) {
            console.log('User lookup error (may not exist yet):', error);
        }

        // If user doesn't exist, create one
        if (!appwriteUser) {
            try {
                appwriteUser = await users.create(
                    ID.unique(),
                    userEmail,
                    undefined, // No phone
                    undefined, // No password (OAuth user)
                    userName
                );

                // Mark email as verified since Google already verified it
                await users.updateEmailVerification(appwriteUser.$id, true);
            } catch (createError: any) {
                // If user already exists (race condition), try to fetch again
                if (createError.code === 409) {
                    const usersList = await users.list([
                        `equal("email", ["${userEmail}"])`
                    ]);
                    if (usersList.users.length > 0) {
                        appwriteUser = usersList.users[0];
                    }
                } else {
                    throw createError;
                }
            }
        }

        if (!appwriteUser) {
            return NextResponse.json(
                { error: 'Failed to create or find user' },
                { status: 500 }
            );
        }

        // Create a session token for the user
        // Note: This creates a session that the client can use
        const sessionToken = await users.createToken(appwriteUser.$id);

        // Return the session info
        // The client will need to use this to complete the authentication
        return NextResponse.json({
            success: true,
            userId: appwriteUser.$id,
            secret: sessionToken.secret,
            expire: sessionToken.expire,
        });

    } catch (error: any) {
        console.error('Native Google auth error:', error);
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 500 }
        );
    }
}
