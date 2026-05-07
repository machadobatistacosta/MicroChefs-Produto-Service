package com.microchefs.produtoservice.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microchefs.produtoservice.dto.DLQSupportDTO;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PedidoProducer {

    @Autowired
    private AmqpTemplate amqpTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public void dlqSender(DLQSupportDTO dlqSupportDTO) {
        try {
            amqpTemplate.convertAndSend(
                    "pedido-exchange",
                    "dead-message",
                    objectMapper.writeValueAsString(dlqSupportDTO)
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao enviar para DLQ", e);
        }
    }
}
