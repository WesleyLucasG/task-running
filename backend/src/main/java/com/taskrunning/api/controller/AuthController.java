package com.taskrunning.api.controller;

import com.taskrunning.api.dto.request.CadastroUsuarioDTO;
import com.taskrunning.api.dto.request.ForgotPasswordDTO;
import com.taskrunning.api.dto.request.LoginDTO;
import com.taskrunning.api.dto.request.RefreshTokenRequestDTO;
import com.taskrunning.api.dto.request.ResetPasswordDTO;
import com.taskrunning.api.dto.request.ValidarCodigoDTO;
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

    // Somente desenvolvimento: devolve o token na resposta para testar sem servidor de e-mail.
    // Em produção (perfil prod) fica false e o token só pode ser entregue por e-mail.
    @org.springframework.beans.factory.annotation.Value("${app.recuperacao.expor-token:true}")
    private boolean exporTokenRecuperacao;

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Void> cadastrar(@RequestBody @Valid CadastroUsuarioDTO dto){
        authService.cadastrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponseDTO> login(@RequestBody @Valid LoginDTO dto){
        TokenResponseDTO response = authService.login(dto);
        return ResponseEntity.ok(response);
    }

    // RNF07: renova o token de acesso com o refresh token (rotação)
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponseDTO> renovar(@RequestBody @Valid RefreshTokenRequestDTO dto) {
        return ResponseEntity.ok(authService.renovar(dto.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> sair(@RequestBody @Valid RefreshTokenRequestDTO dto) {
        authService.encerrarSessao(dto.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody @Valid ForgotPasswordDTO dto){
        String token = authService.recuperarSenha(dto);
        String mensagem = "Se o e-mail informado estiver cadastrado, as instruções para redefinir a senha foram enviadas.";

        if (token != null && exporTokenRecuperacao){
            return ResponseEntity.ok(Map.of("mensagem", mensagem, "tokenTeste", token));
        }
        return ResponseEntity.ok(Map.of("mensagem", mensagem));
    }

    // Etapa 2 da recuperação: confere o código recebido por e-mail (204 = válido, sem consumir o código)
    @PostMapping("/validar-codigo")
    public ResponseEntity<Void> validarCodigo(@RequestBody @Valid ValidarCodigoDTO dto){
        authService.validarCodigo(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordDTO dto){
        authService.redefinirSenha(dto);
        return ResponseEntity.noContent().build();
    }


}
