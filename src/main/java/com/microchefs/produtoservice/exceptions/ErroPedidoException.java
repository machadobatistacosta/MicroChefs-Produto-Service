package com.microchefs.produtoservice.exceptions;

public class ErroPedidoException extends RuntimeException {
    public ErroPedidoException(String message) {
        super(message);
    }
}
