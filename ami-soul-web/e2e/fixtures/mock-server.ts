import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let activeScenario = 'default';
let currentSocketId: string | null = null;

// REST API to control scenarios
app.post('/scenario', (req, res) => {
  const { scenario } = req.body;
  activeScenario = scenario;
  console.log(`[MockServer] Scenario set to: ${scenario}`);
  res.json({ success: true, scenario });
});

app.post('/disconnect', (req, res) => {
  if (currentSocketId) {
    io.sockets.sockets.get(currentSocketId)?.disconnect();
    res.json({ success: true, message: 'Socket disconnected' });
  } else {
    res.status(404).json({ success: false, message: 'No active socket' });
  }
});

io.on('connection', (socket) => {
  console.log(`[MockServer] Client connected: ${socket.id}`);
  currentSocketId = socket.id;

  const deviceId = socket.handshake.auth.device_id || socket.handshake.query.device_id;
  console.log(`[MockServer] Device ID: ${deviceId}`);

  socket.on('message_sent', async (data) => {
    console.log(`[MockServer] Received message_sent:`, data);
    const { content, messageId } = data;

    if (activeScenario === 'onboarding' || activeScenario === 'streaming') {
      // Simulate processing
      socket.emit('processing_start', { messageId: 'ai-' + Date.now() });
      
      await new Promise(r => setTimeout(r, 800));

      const text = activeScenario === 'onboarding' 
        ? "Chào mừng bạn đến với AmiSoul! Tôi có thể giúp gì cho bạn?" 
        : "Đây là một tin nhắn phản hồi từ mock server để kiểm tra khả năng streaming của hệ thống.";
      
      const chunks = text.split(' ');
      const aiMessageId = 'ai-' + Date.now();

      for (let i = 0; i < chunks.length; i++) {
        // Wait between chunks
        await new Promise(r => setTimeout(r, 150));
        
        socket.emit('stream_chunk', {
          messageId: aiMessageId,
          content: chunks[i] + (i === chunks.length - 1 ? '' : ' '),
          isFirst: i === 0,
        });
      }

      socket.emit('stream_end', { messageId: aiMessageId });
      socket.emit('vibe_update', { vibe: 'neutral' });
    }

    if (activeScenario === 'preemption') {
      const aiMessageId = 'ai-preempt-' + Date.now();
      socket.emit('processing_start', { messageId: aiMessageId });
      
      // Send a few chunks then wait for interrupt
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 300));
        socket.emit('stream_chunk', {
          messageId: aiMessageId,
          content: `Đây là đoạn văn dài số ${i + 1}... `,
          isFirst: i === 0,
        });
      }
      // Scenario expects interrupt from client here
    }
  });

  socket.on('interrupt', (data) => {
    console.log(`[MockServer] Received interrupt:`, data);
    // In a real scenario, this would stop the current generation loop
  });

  socket.on('disconnect', () => {
    console.log(`[MockServer] Client disconnected: ${socket.id}`);
    if (currentSocketId === socket.id) currentSocketId = null;
  });
});

const PORT = 3006;
httpServer.listen(PORT, () => {
  console.log(`[MockServer] Running at http://localhost:${PORT}`);
});
