import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/chat_service.dart';

class ChatBottomSheet extends StatefulWidget {
  final String topicId;
  final String topicType;
  final String? topicTitle;
  final String customerName;
  final String customerEmail;

  const ChatBottomSheet({
    super.key,
    required this.topicId,
    required this.topicType,
    this.topicTitle,
    required this.customerName,
    required this.customerEmail,
  });

  static void show(
    BuildContext context, {
    required String topicId,
    required String topicType,
    String? topicTitle,
    required String customerName,
    required String customerEmail,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ChatBottomSheet(
        topicId: topicId,
        topicType: topicType,
        topicTitle: topicTitle,
        customerName: customerName,
        customerEmail: customerEmail,
      ),
    );
  }

  @override
  State<ChatBottomSheet> createState() => _ChatBottomSheetState();
}

class _ChatBottomSheetState extends State<ChatBottomSheet> {
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<ChatMessageItem> _messages = [];
  bool _loading = true;
  bool _sending = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) => _fetchMessages());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    final list = await ChatService.getMessages(widget.topicId);
    if (mounted) {
      setState(() {
        _messages = list;
        _loading = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSend() async {
    final text = _msgController.text.trim();
    if (text.isEmpty || _sending) return;

    _msgController.clear();
    setState(() => _sending = true);

    final success = await ChatService.sendMessage(
      topicId: widget.topicId,
      topicType: widget.topicType,
      topicTitle: widget.topicTitle,
      senderName: widget.customerName.isNotEmpty ? widget.customerName : 'Traveler',
      senderEmail: widget.customerEmail.isNotEmpty ? widget.customerEmail : 'user@holidaycity.com',
      message: text,
    );

    if (mounted) {
      setState(() => _sending = false);
      if (success) {
        _fetchMessages();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.82,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle Bar
            Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
              ),
            ),

            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0A6FB5).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.chat_bubble_outline, color: Color(0xFF0A6FB5), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Chat Direct Admin',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0A6FB5),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                widget.topicType.toUpperCase(),
                                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          'Ref: ${widget.topicId} ${widget.topicTitle != null ? '• ${widget.topicTitle}' : ''}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Close',
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Message Body
            Expanded(
              child: _loading && _messages.isEmpty
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF0A6FB5)))
                  : _messages.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.chat_outlined, size: 48, color: Colors.grey[300]),
                              const SizedBox(height: 12),
                              const Text(
                                'Start Direct Conversation',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Ask anything regarding ref ${widget.topicId}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final msg = _messages[index];
                            final isUser = msg.senderType == 'User';

                            return Align(
                              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isUser ? const Color(0xFF0A6FB5) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(18),
                                    topRight: const Radius.circular(18),
                                    bottomLeft: Radius.circular(isUser ? 18 : 4),
                                    bottomRight: Radius.circular(isUser ? 4 : 18),
                                  ),
                                ),
                                child: Text(
                                  msg.message,
                                  style: TextStyle(
                                    color: isUser ? Colors.white : const Color(0xFF1E293B),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),

            // Composer Input
            SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: TextField(
                          controller: _msgController,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          decoration: const InputDecoration(
                            hintText: 'Type message...',
                            hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _handleSend,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: Color(0xFF0A6FB5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
