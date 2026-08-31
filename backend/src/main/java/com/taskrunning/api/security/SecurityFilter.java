package com.taskrunning.api.security;

import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class SecurityFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private String recuperarToken(HttpServletRequest request){
        var authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")){
            return null;
        }
        return authHeader.replace("Bearer ", "").trim();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain )
            throws ServletException, IOException{

        var token = recuperarToken(request);

        if (token != null){
            var email = tokenService.validarToken(token);

            if(!email.isEmpty()){
                Usuario usuario = usuarioRepository.findByEmail(email);

                if(usuario != null){
                    var authentication = new UsernamePasswordAuthenticationToken(usuario, null, usuario.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

}
