package com.taskrunning.api.config;

import com.taskrunning.api.security.SecurityFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(req -> {
                    // Suas rotas existentes (preservadas 100%)
                    req.requestMatchers(HttpMethod.POST, "/auth/login").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/auth/refresh", "/auth/logout").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/api/saude").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/auth/register").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/auth/forgot-password").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/auth/reset-password").permitAll();
                    req.requestMatchers("/", "/swagger-ui/**", "/v3/api-docs/**", "/auth/**").permitAll();

                    req.requestMatchers(
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger-ui.html",
                            "/swagger-resources/**",
                            "/webjars/**"
                    ).permitAll();

                    req.anyRequest().authenticated();
                })
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // CORS para o frontend Web (o app mobile nativo não usa CORS). Origens via CORS_ORIGENS.
    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource(
            @org.springframework.beans.factory.annotation.Value("${app.cors.origens:}") String origens) {
        var config = new org.springframework.web.cors.CorsConfiguration();
        java.util.Arrays.stream(origens.split(",")).map(String::trim).filter(o -> !o.isEmpty())
                .forEach(config::addAllowedOrigin);
        config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type"));
        var fonte = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/**", config);
        return fonte;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}