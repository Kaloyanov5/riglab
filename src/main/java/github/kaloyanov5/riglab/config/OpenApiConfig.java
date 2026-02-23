package github.kaloyanov5.riglab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI rigLabOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("RigLab API")
                        .description("PC Building Configurator REST API - Build and validate custom PC configurations with compatibility checks")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("kaloyanov5")
                                .url("https://github.com/kaloyanov5"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")));
    }
}

