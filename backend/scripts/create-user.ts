import { MongoClient, ObjectId } from 'mongodb';
import { hash } from 'bcrypt';
import { IUser, UserRole } from '../../shared/types/user';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'froggy_cms';

async function createUser(email: string, password: string, name: string, role: UserRole = UserRole.ADMIN) {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            console.error('User with this email already exists');
            process.exit(1);
        }

        // Hash password
        const hashedPassword = await hash(password, 10);

        const user: IUser = {
            email,
            password: hashedPassword,
            name,
            role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(user);
        console.log(`User created successfully with ID: ${result.insertedId}`);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: npm run create-user <email> <password> <name> [role]');
    process.exit(1);
}

const [email, password, name, role] = args;
createUser(email, password, name, role as UserRole || UserRole.ADMIN); 