package com.microchefs.produtoservice.dto;

import java.time.LocalDateTime;

public record DLQSupportDTO(
        String tipoMensagem,
        String filaDeOrigem,
        String tipoErro,
        String mensagemDeErro,
        String mensagemOriginal,
        LocalDateTime timestamp
) {}
