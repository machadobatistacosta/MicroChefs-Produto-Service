package com.microchefs.produtoservice.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public TopicExchange pedidoExchange() {
        return new TopicExchange("pedido-exchange");
    }

    @Bean
    public Queue frontQueue() {
        return new Queue("front-queue", true);
    }

    @Bean
    public Binding frontBinding(Queue frontQueue, TopicExchange pedidoExchange) {
        return BindingBuilder.bind(frontQueue).to(pedidoExchange).with("pedido-key.status");
    }

    @Bean
    public Queue deadLetterQueue() {
        return new Queue("dead-letter-queue", true);
    }

    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, TopicExchange pedidoExchange) {
        return BindingBuilder.bind(deadLetterQueue).to(pedidoExchange).with("dead-message");
    }
}
