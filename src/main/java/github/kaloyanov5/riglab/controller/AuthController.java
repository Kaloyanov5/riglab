package github.kaloyanov5.riglab.controller;

import github.kaloyanov5.riglab.dto.LoginRequest;
import github.kaloyanov5.riglab.dto.RegisterRequest;
import github.kaloyanov5.riglab.dto.UserResponse;
import github.kaloyanov5.riglab.entity.User;
import github.kaloyanov5.riglab.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login and session management")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a USER account and logs in. Returns the user and a session cookie.")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        User user = userService.register(request);

        authenticate(request.username(), request.password(), httpRequest, httpResponse);

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromEntity(user));
    }

    @PostMapping("/login")
    @Operation(summary = "Log in", description = "Authenticates the user and starts a session (JSESSIONID cookie).")
    public ResponseEntity<UserResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        authenticate(request.username(), request.password(), httpRequest, httpResponse);

        User user = userService.getByUsername(request.username());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out", description = "Invalidates the current session.")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    @Operation(summary = "Current user", description = "Returns the currently authenticated user, or 401 if anonymous.")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    private void authenticate(String username, String password,
                              HttpServletRequest httpRequest,
                              HttpServletResponse httpResponse) {
        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(username, password);
        Authentication auth = authenticationManager.authenticate(token);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
    }
}
