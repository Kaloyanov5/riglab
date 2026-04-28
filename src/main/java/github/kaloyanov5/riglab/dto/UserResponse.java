package github.kaloyanov5.riglab.dto;

import github.kaloyanov5.riglab.entity.Role;
import github.kaloyanov5.riglab.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Authenticated user details")
public record UserResponse(
        Long id,
        String username,
        Role role
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
