package com.taskrunning.api.controller;

import com.taskrunning.api.dto.response.LogAuditoriaResponseDTO;
import com.taskrunning.api.repository.LogAuditoriaAtividadeRepository;
import com.taskrunning.api.repository.LogAuditoriaContaRepository;
import com.taskrunning.api.repository.LogAuditoriaEconomiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LogAuditoriaAtividadeRepository atividadeRepo;
    private final LogAuditoriaContaRepository contaRepo;
    private final LogAuditoriaEconomiaRepository economiaRepo;

    @GetMapping("/logs/atividade")
    public ResponseEntity<Page<LogAuditoriaResponseDTO>> logsAtividade(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "50") int tamanho,
            @RequestParam(required = false) String operacao) {
        var pr = pageRequest(pagina, tamanho);
        var page = (operacao != null && !operacao.isBlank())
                ? atividadeRepo.findByOperacao(operacao.toUpperCase(), pr)
                : atividadeRepo.findAll(pr);
        return ResponseEntity.ok(page.map(LogAuditoriaResponseDTO::from));
    }

    @GetMapping("/logs/conta")
    public ResponseEntity<Page<LogAuditoriaResponseDTO>> logsConta(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "50") int tamanho,
            @RequestParam(required = false) String operacao) {
        var pr = pageRequest(pagina, tamanho);
        var page = (operacao != null && !operacao.isBlank())
                ? contaRepo.findByOperacao(operacao.toUpperCase(), pr)
                : contaRepo.findAll(pr);
        return ResponseEntity.ok(page.map(LogAuditoriaResponseDTO::from));
    }

    @GetMapping("/logs/economia")
    public ResponseEntity<Page<LogAuditoriaResponseDTO>> logsEconomia(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "50") int tamanho,
            @RequestParam(required = false) String operacao) {
        var pr = pageRequest(pagina, tamanho);
        var page = (operacao != null && !operacao.isBlank())
                ? economiaRepo.findByOperacao(operacao.toUpperCase(), pr)
                : economiaRepo.findAll(pr);
        return ResponseEntity.ok(page.map(LogAuditoriaResponseDTO::from));
    }

    private PageRequest pageRequest(int pagina, int tamanho) {
        return PageRequest.of(pagina, Math.min(tamanho, 100),
                Sort.by(Sort.Direction.DESC, "dataHora"));
    }
}
