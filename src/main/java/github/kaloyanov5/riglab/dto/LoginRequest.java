package github.kaloyanov5.riglab.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request to log in")
public record LoginRequest(
        @NotBlank(message = "Username is required")
        @Schema(description = "Username", example = "alice")
        String username,

        @NotBlank(message = "Password is required")
        @Schema(description = "Password", example = "secret123")
        String password
) {}
