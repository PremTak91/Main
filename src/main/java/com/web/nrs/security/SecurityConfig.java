package com.web.nrs.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/login/**",
                        "/registration/**",
                        "/css/**", "/js/**", "/images/**",
                        "/images/employeePhoto/**", "/images/postImages/**",
                        "/webjars/**",
                        "/login",
                        "/registration"
                ).permitAll()
                .anyRequest().authenticated()
            )
            // Custom entry point: redirect browser requests to /login, return 401 for AJAX
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    String acceptHeader = request.getHeader("Accept");
                    String xRequestedWith = request.getHeader("X-Requested-With");
                    boolean isAjax = "XMLHttpRequest".equalsIgnoreCase(xRequestedWith)
                            || (acceptHeader != null && acceptHeader.contains("application/json"));

                    if (isAjax) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Unauthorized\", \"expired\": true}");
                    } else {
                        response.sendRedirect(request.getContextPath() + "/login?expired=true");
                    }
                })
            )
            .logout(logout -> logout.disable())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}