package github.kaloyanov5.riglab.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Request to register a new user account")
public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 32, message = "Username must be 3-32 characters")
        @Pattern(regexp = "^[A-Za-z0-9_.-]+$", message = "Username may contain letters, digits, _ . -")
        @Schema(description = "Username", example = "alice")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be 6-100 characters")
        @Schema(description = "Password (min 6 chars)", example = "secret123")
        String password
) {}
