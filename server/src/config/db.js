// =============================================================================
// VLRK - Database Client (Prisma)
// =============================================================================
// Singleton Prisma client instance to prevent multiple connections in dev
// =============================================================================

const { PrismaClient } = require('@prisma/client');

// Use global variable in development to prevent hot-reload creating new connections
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
