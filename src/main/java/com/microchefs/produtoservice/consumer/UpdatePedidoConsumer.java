package com.microchefs.produtoservice.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microchefs.produtoservice.dto.DLQSupportDTO;
import com.microchefs.produtoservice.dto.UpdatePedidoDTO;
import com.microchefs.produtoservice.exceptions.ErroPedidoException;
import com.microchefs.produtoservice.exceptions.InfraException;
import com.microchefs.produtoservice.producer.PedidoProducer;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class UpdatePedidoConsumer {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PedidoProducer pedidoProducer;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = "front-queue")
    public void receberAtualizacao(@Payload String updateJson) {
        try {
            UpdatePedidoDTO update = converterMensagemJSON(updateJson);
            processarAtualizacao(update);
        } catch (Exception e) {
            processarErro(e, updateJson);
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 5000), retryFor = { InfraException.class })
    public void processarAtualizacao(UpdatePedidoDTO update) {
        validarStatus(update.statusPedido());
        try {
            // Send to WebSocket
            messagingTemplate.convertAndSend("/topic/pedido-status", update);
            System.out.println("Status do pedido " + update.id() + " enviado para o front via WebSocket: " + update.statusPedido());
        } catch (Exception e) {
            throw new InfraException("Erro ao processar atualização: " + e.getMessage());
        }
    }

    private void validarStatus(String status) {
        boolean valido = java.util.Arrays.stream(new String[]{"CRIADO", "AGUARDANDO_PAGAMENTO", "PAGO", "EM_PREPARO", "PRONTO", "CANCELADO"})
                .anyMatch(s -> s.equals(status));
        if (!valido) {
            throw new ErroPedidoException("Status inválido: " + status);
        }
    }

    private UpdatePedidoDTO converterMensagemJSON(String updateJson) {
        try {
            return objectMapper.readValue(updateJson, UpdatePedidoDTO.class);
        } catch (Exception e) {
            throw new ErroPedidoException("JSON contém dados inválidos");
        }
    }

    public void processarErro(Exception e, String json) {
        String tipo = (e instanceof InfraException) ? "INFRA_ERROR" : "DATA_ERROR";
        DLQSupportDTO dlqSupportDTO = new DLQSupportDTO(
                "PEDIDO_STATUS_UPDATE",
                "front-queue",
                tipo,
                e.getMessage(),
                json,
                LocalDateTime.now()
        );
        pedidoProducer.dlqSender(dlqSupportDTO);
        System.out.println("Erro processado e enviado para DLQ: " + e.getMessage());
    }
}
