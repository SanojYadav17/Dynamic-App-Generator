import mongoose, { Connection } from 'mongoose';

let cachedConnection: Connection | null = null;

/**
 * MongoDB Connection Handler
 * Maintains a single connection across hot reloads in development
 */
export async function connectToDatabase(): Promise<Connection> {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    cachedConnection = conn.connection;
    return cachedConnection;
  } catch (error) {
    throw error;
  }
}

export async function disconnectDatabase() {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
  }
}
