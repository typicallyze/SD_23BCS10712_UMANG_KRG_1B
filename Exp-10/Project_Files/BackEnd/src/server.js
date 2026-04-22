import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const REDIS_URL = process.env.REDIS_URL;
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();

const redisClient = new Redis(REDIS_URL); // for get/set cache

io.adapter(createAdapter(pubClient, subClient));

// API endpoint to fetch initial document or create one if it doesn't exist
app.post('/api/documents', async (req, res) => {
  try {
    const doc = await prisma.document.create({
      data: {
        title: req.body.title || 'Untitled Document',
        content: req.body.content || '',
      }
    });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let content = await redisClient.get(`doc:${id}`);
    
    let doc = await prisma.document.findUnique({ where: { id } });

    // Implicitly create if it doesn't exist
    if (!doc) {
      doc = await prisma.document.create({
        data: {
          id: id,
          title: id,
          content: `# Welcome to ${id}\nStart typing here...`
        }
      });
    }

    // If cache exists, override the DB version in the response
    if (content !== null) {
      doc.content = content;
    } else {
      await redisClient.set(`doc:${id}`, doc.content);
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A Map to store timeout IDs for debouncing saves
const saveTimers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', async (documentId) => {
    socket.join(documentId);
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  socket.on('send-changes', async ({ documentId, content }) => {
    // Broadcast changes to others in the room
    socket.to(documentId).emit('receive-changes', content);

    // Update Redis Cache
    await redisClient.set(`doc:${documentId}`, content);

    // Debounce save to Postgres
    if (saveTimers.has(documentId)) {
      clearTimeout(saveTimers.get(documentId));
    }

    const timerId = setTimeout(async () => {
      try {
        const currentContent = await redisClient.get(`doc:${documentId}`);
        if (currentContent !== null) {
          await prisma.document.update({
            where: { id: documentId },
            data: { content: currentContent }
          });
          console.log(`Document ${documentId} flushed to Postgres.`);
        }
      } catch (e) {
        console.error('Error saving to Postgres:', e.message);
      }
      saveTimers.delete(documentId);
    }, 2000); // 2 seconds debounce

    saveTimers.set(documentId, timerId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
