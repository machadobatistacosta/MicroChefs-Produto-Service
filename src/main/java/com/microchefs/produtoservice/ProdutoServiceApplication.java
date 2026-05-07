package com.microchefs.produtoservice;

import com.microchefs.produtoservice.model.Produto;
import com.microchefs.produtoservice.repository.ProdutoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.math.BigDecimal;

@SpringBootApplication
@EnableDiscoveryClient
@EnableRetry
public class ProdutoServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProdutoServiceApplication.class, args);
	}

	@Bean
	public CommandLineRunner loadData(ProdutoRepository repository) {
		return args -> {
			if (repository.count() == 0) {
				repository.save(Produto.builder()
						.nome("Hambúrguer Clássico")
						.descricao("Pão brioche, carne 180g, queijo cheddar e maionese da casa.")
						.preco(new BigDecimal("35.00"))
						.categoria("Lanches")
						.disponivel(true)
						.urlImagem("https://images.unsplash.com/photo-1568901346375-23c9450c58cd")
						.build());

				repository.save(Produto.builder()
						.nome("Pizza Calabresa")
						.descricao("Molho de tomate, mussarela, calabresa e cebola.")
						.preco(new BigDecimal("45.00"))
						.categoria("Pizzas")
						.disponivel(true)
						.urlImagem("https://images.unsplash.com/photo-1513104890138-7c749659a591")
						.build());

				repository.save(Produto.builder()
						.nome("Batata Frita")
						.descricao("Porção de 400g de batata frita crocante.")
						.preco(new BigDecimal("20.00"))
						.categoria("Acompanhamentos")
						.disponivel(true)
						.urlImagem("https://images.unsplash.com/photo-1630384060421-cb20d0e0649d")
						.build());
			}
		};
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
						.allowedOrigins("http://localhost:4200", "http://127.0.0.1:4200")
						.allowedMethods("*")
						.allowedHeaders("*")
						.allowCredentials(true);
			}
		};
	}
}

