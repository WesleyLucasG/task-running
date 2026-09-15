package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.response.TokenResponseDTO;
import com.taskrunning.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Void> cadastrar(@RequestBody @Valid CadastroUsuarioDTO dto){
        authService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    private ResponseEntity<TokenResponseDTO> login(@RequestBody @Valid LoginDTO dto){
        TokenResponseDTO response = authService.login(dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot_password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody @Valid ForgotPasswordDTO dto){
        String token = authService.recuperarSenha(dto);
        String mensagem = "Se o e-mail informado estiver cadastrado, as instruções para redefinir a senha foram enviadas.";

        if (token != null){
            return ResponseEntity.ok(Map.of("mensagem", mensagem, "tokenTeste", token));
        }
        return ResponseEntity.ok(Map.of("mensagem", mensagem));
    }

}
