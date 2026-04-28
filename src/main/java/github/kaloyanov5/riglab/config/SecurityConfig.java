package github.kaloyanov5.riglab.config;

import github.kaloyanov5.riglab.entity.Role;
import github.kaloyanov5.riglab.entity.User;
import github.kaloyanov5.riglab.repository.UserRepository;
import github.kaloyanov5.riglab.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService,
                                                            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Auth endpoints are public
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/me", "/api/auth/logout").permitAll()

                        // Admin-only API mutations (the admin HTML/JS pages themselves are public —
                        // the JS calls /api/auth/me and redirects non-admins to login)
                        .requestMatchers(HttpMethod.POST, "/api/components/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/components/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/components/**").hasRole("ADMIN")

                        // Build mutations require an authenticated user (USER or ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/builds").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/builds/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/builds/**").authenticated()
                        .requestMatchers("/api/builds/me", "/api/builds/me/**").authenticated()

                        // Compatibility check is public — anyone can validate before saving
                        .requestMatchers(HttpMethod.POST, "/api/builds/check-compatibility",
                                "/api/builds/check-compatibility/**").permitAll()

                        // Everything else (static pages, GET catalog, swagger) is public
                        .anyRequest().permitAll()
                )
                // Return JSON 401 for unauthenticated API access instead of redirecting to login form
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable());

        return http.build();
    }

    /**
     * Seeds the configured admin user on startup if no admin exists yet.
     */
    @Bean
    public CommandLineRunner adminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername(adminUsername).isEmpty()) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPasswordHash(passwordEncoder.encode(adminPassword));
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }
        };
    }
}
