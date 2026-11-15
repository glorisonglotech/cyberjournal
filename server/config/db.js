import mongoose from "mongoose";

let memoryServer = null;

/**
 * Connects to MongoDB.
 *
 * Production and any environment with MONGO_URI set uses that cluster.
 * In development, if no URI is supplied, a disposable in-memory MongoDB is
 * started so the publication runs without a system install. Data written to
 * that instance is discarded when the process exits.
 */
export async function connectDB() {
  const uri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  mongoose.set("strictQuery", true);

  if (uri) {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    return { mode: "persistent", uri };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MONGO_URI is required in production. Refusing to start against an in-memory database.",
    );
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: "glorison-journal" },
  });

  await mongoose.connect(memoryServer.getUri());
  return { mode: "in-memory", uri: memoryServer.getUri() };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export function isMemoryMode() {
  return Boolean(memoryServer);
}
