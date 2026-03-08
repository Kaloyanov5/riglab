package github.kaloyanov5.riglab.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

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
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        var admin = User.builder()
                .username(adminUsername)
                .password(encoder.encode(adminPassword))
                .roles("ADMIN")
                .build();
        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Admin pages require auth
                        .requestMatchers("/admin.html", "/admin.js").hasRole("ADMIN")
                        // API mutations require admin
                        .requestMatchers(HttpMethod.POST, "/api/components/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/components/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/components/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/builds/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/builds/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/builds/**").hasRole("ADMIN")
                        // Admin auth endpoint
                        .requestMatchers("/api/admin/**").permitAll()
                        // Everything else is public
                        .anyRequest().permitAll()
                )
                .formLogin(form -> form
                        .loginPage("/admin-login.html")
                        .loginProcessingUrl("/api/admin/login")
                        .defaultSuccessUrl("/admin.html", true)
                        .failureUrl("/admin-login.html?error=true")
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/api/admin/logout")
                        .logoutSuccessUrl("/admin-login.html?logout=true")
                        .permitAll()
                );

        return http.build();
    }
}

