package com.example.ticketing.chat;

import com.example.ticketing.common.auth.User;
import com.example.ticketing.common.auth.UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<?> findAllChat() {
        List<ChatResponseDto> chats = chatService.findAllChat();
        return ResponseEntity.ok(chats);
    }

    @PostMapping
    public ResponseEntity<?> sendChat(@User UserInfo userInfo, @RequestBody ChatRequestDto dto) {
        chatService.saveChat(userInfo, dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/connection", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> connectChat() {
        SseEmitter emitter = chatService.connectChat();
        return ResponseEntity.ok(emitter);
    }
}
