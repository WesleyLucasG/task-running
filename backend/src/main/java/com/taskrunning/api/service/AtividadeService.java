package com.taskrunning.api.service;

import com.taskrunning.api.dto.request.PontoGpsRequestDTO;
import com.taskrunning.api.dto.request.SincronizarAtividadeRequestDTO;
import com.taskrunning.api.dto.response.AtividadeResponseDTO;
import com.taskrunning.api.dto.response.PontoGpsResponseDTO;
import com.taskrunning.api.entity.Atividade;
import com.taskrunning.api.entity.PontoGps;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.enums.StatusAtividade;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.AtividadeRepository;
import com.taskrunning.api.repository.PontoGpsRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import com.taskrunning.api.util.CalculoGeograficoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    private final AtividadeRepository atividadeRepository;
    private final PontoGpsRepository pontoGpsRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public AtividadeResponseDTO sincronizarAtividade(String email, SincronizarAtividadeRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado para o e-mail: " + email));

        var atividadeExistente = atividadeRepository.findByIdentificadorLocalAndUsuarioId(dto.identificadorLocal(), usuario.getId());
        if (atividadeExistente.isPresent()) {
            return mapearParaDTO(atividadeExistente.get());
        }

        Atividade atividade = new Atividade();
        atividade.setUsuario(usuario);
        atividade.setIdentificadorLocal(dto.identificadorLocal());
        atividade.setTipoAtividade(dto.tipoAtividade());
        atividade.setStatus(StatusAtividade.CONCLUIDA);
        atividade.setDataInicio(dto.dataInicio());
        atividade.setDataFim(dto.dataFim());
        atividade.setDuracaoSegundos(dto.duracaoSegundos());

        List<PontoGps> pontosGpsList = new ArrayList<>();
        double distanciaTotalMetros = 0.0;
        PontoGpsRequestDTO pontoAnterior = null;

        for (PontoGpsRequestDTO pontoDTO : dto.pontosGps()) {
            if (pontoAnterior != null) {
                distanciaTotalMetros += CalculoGeograficoUtil.calcularDistanciaHaversine(
                        pontoAnterior.latitude(), pontoAnterior.longitude(),
                        pontoDTO.latitude(), pontoDTO.longitude()
                );
            }
            pontoAnterior = pontoDTO;

            PontoGps ponto = new PontoGps();
            ponto.setAtividade(atividade);
            ponto.setLatitude(pontoDTO.latitude());
            ponto.setLongitude(pontoDTO.longitude());
            ponto.setAltitude(pontoDTO.altitude());
            ponto.setTimestamp(pontoDTO.timestamp());
            pontosGpsList.add(ponto);
        }

        atividade.setDistanciaMetros(distanciaTotalMetros);

        double paceMedio = CalculoGeograficoUtil.calcularPaceMedio(distanciaTotalMetros, dto.duracaoSegundos());
        atividade.setPaceMedio(paceMedio);

        double pesoUsuario = usuario.getPeso() != null ? usuario.getPeso() : 70.0;
        int calorias = CalculoGeograficoUtil.calcularCalorias(dto.tipoAtividade(), pesoUsuario, dto.duracaoSegundos());
        atividade.setCalorias(calorias);

        Atividade atividadeSalva = atividadeRepository.save(atividade);
        pontoGpsRepository.saveAll(pontosGpsList);
        atividadeSalva.setPontosGps(pontosGpsList);

        return mapearParaDTO(atividadeSalva);
    }

    @Transactional(readOnly = true)
    public AtividadeResponseDTO obterPorId(Long id, String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        Atividade atividade = atividadeRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Atividade não encontrada ou não pertence ao usuário."));

        return mapearParaDTO(atividade);
    }

    private AtividadeResponseDTO mapearParaDTO(Atividade atividade) {
        List<PontoGpsResponseDTO> pontosGpsDTO = atividade.getPontosGps() != null
                ? atividade.getPontosGps().stream()
                  .map(p -> new PontoGpsResponseDTO(
                          p.getId(),
                          p.getLatitude(),
                          p.getLongitude(),
                          p.getAltitude(),
                          p.getTimestamp()
                  )).toList()
                : List.of();

        return new AtividadeResponseDTO(
                atividade.getId(),
                atividade.getIdentificadorLocal(),
                atividade.getTipoAtividade().name(),
                atividade.getStatus().name(),
                atividade.getDataInicio(),
                atividade.getDataFim(),
                atividade.getDuracaoSegundos(),
                atividade.getDistanciaMetros(),
                atividade.getCalorias(),
                atividade.getPaceMedio(),
                pontosGpsDTO
        );
    }
}