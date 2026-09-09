import { Request, Response } from 'express';
import { ChatMessage } from '../models/ChatMessage.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendChatReplyNotificationEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const {
      topicId,
      topicType,
      topicTitle,
      senderType,
      senderName,
      senderEmail,
      message,
      attachments
    } = req.body;

    const resolvedTopicId = (topicId || '').toString().trim();
    const resolvedSenderType = (senderType || 'User').toString().trim() as 'User' | 'Admin';
    const resolvedSenderName = (senderName || 'Traveler').toString().trim();
    const resolvedSenderEmail = (senderEmail || 'customer@holidaycity.com').toString().trim().toLowerCase();
    const resolvedMessage = (message || '').toString().trim();

    if (!resolvedTopicId || !resolvedMessage) {
      return res.status(400).json({
        success: false,
        message: 'topicId and message are required.'
      });
    }

    const authUserId = (req as AuthRequest).user?.id || '';

    const rawType = (topicType || '').toString().toLowerCase();
    let normalizedTopicType = 'General';
    if (rawType.includes('booking') || resolvedTopicId.startsWith('BK')) normalizedTopicType = 'Booking';
    else if (rawType.includes('enquir') || resolvedTopicId.startsWith('HC')) normalizedTopicType = 'Enquiry';

    const newMsg = await ChatMessage.create({
      topicId: resolvedTopicId,
      topicType: normalizedTopicType,
      topicTitle: (topicTitle || '').toString().trim(),
      senderType: resolvedSenderType,
      senderId: authUserId,
      senderName: resolvedSenderName,
      senderEmail: resolvedSenderEmail,
      message: resolvedMessage,
      attachments: attachments || [],
      isReadByAdmin: resolvedSenderType === 'Admin',
      isReadByUser: resolvedSenderType === 'User'
    });

    console.log(`💬 [Chat] Message saved in DB. Topic: ${resolvedTopicId}, Sender: ${resolvedSenderType} (${resolvedSenderName})`);

    // Broadcast via global Socket.io if initialized
    const io = (global as any).io;
    if (io) {
      io.to(`chat_${resolvedTopicId}`).emit('new_chat_message', newMsg);
      io.emit('chat_activity_update', { topicId: resolvedTopicId, newMsg });
    }

    if (resolvedSenderType === 'User') {
      createNotification({
        type: 'chat',
        title: `💬 New Chat from ${resolvedSenderName}`,
        message: resolvedMessage.length > 60 ? `${resolvedMessage.substring(0, 60)}...` : resolvedMessage,
        entityId: resolvedTopicId,
        link: normalizedTopicType === 'Booking' ? '/admin/bookings' : '/admin/leads'
      });
    }

    // If Admin sent the message, trigger push notification & email to user
    if (resolvedSenderType === 'Admin') {
      if (resolvedSenderEmail && resolvedSenderEmail.length > 3 && !resolvedSenderEmail.includes('holidaycity.com')) {
        createNotification({
          type: 'chat',
          title: `💬 Support Reply (${resolvedTopicId})`,
          message: resolvedMessage.length > 80 ? `${resolvedMessage.substring(0, 80)}...` : resolvedMessage,
          entityId: resolvedTopicId,
          link: '/my-enquiries',
          userEmail: resolvedSenderEmail
        }).catch(err => console.error('[ChatController] Push notify error:', err));
      }

      sendChatReplyNotificationEmail({
        recipientEmail: resolvedSenderEmail,
        recipientName: resolvedSenderName,
        senderName: 'HolidayCity Support',
        messageText: resolvedMessage,
        topicId: resolvedTopicId,
        topicTitle
      }).catch(err => console.error('[ChatController] Email notify error:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMsg
    });
  } catch (error: any) {
    console.error('[ChatController] sendChatMessage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopicMessages = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { email } = req.query;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let query: any = {};
    if (topicId && topicId !== 'all') {
      query.topicId = topicId.toString().trim();
    } else if (email) {
      query.senderEmail = email.toString().trim().toLowerCase();
    }

    const messages = await ChatMessage.find(query).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminConversations = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const messages = await ChatMessage.find().sort({ createdAt: -1 });

    // Group messages by topicId
    const conversationsMap: { [key: string]: any } = {};

    messages.forEach(msg => {
      const tid = msg.topicId;
      if (!conversationsMap[tid]) {
        conversationsMap[tid] = {
          topicId: tid,
          topicType: msg.topicType || 'General',
          topicTitle: msg.topicTitle || '',
          customerName: msg.senderName || 'Customer',
          customerEmail: msg.senderEmail || 'customer@holidaycity.com',
          lastMessage: msg.message,
          lastSenderType: msg.senderType,
          lastTimestamp: msg.createdAt,
          unreadCount: 0,
          messages: []
        };
      }

      if (msg.senderType === 'User') {
        if (msg.senderName && msg.senderName !== 'Traveler') {
          conversationsMap[tid].customerName = msg.senderName;
        }
        if (msg.senderEmail && msg.senderEmail !== 'user@holidaycity.com') {
          conversationsMap[tid].customerEmail = msg.senderEmail;
        }
      }

      if (!msg.isReadByAdmin) {
        conversationsMap[tid].unreadCount += 1;
      }
    });

    const conversations = Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

    return res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markTopicAsRead = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { readerType } = req.body; // 'Admin' | 'User'

    if (readerType === 'Admin') {
      await ChatMessage.updateMany({ topicId }, { isReadByAdmin: true });
    } else {
      await ChatMessage.updateMany({ topicId }, { isReadByUser: true });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
