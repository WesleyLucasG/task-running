package com.taskrunning.api.service;

import com.taskrunning.api.dto.response.AvatarResponseDTO;
import com.taskrunning.api.dto.response.CarteiraResponseDTO;
import com.taskrunning.api.entity.Avatar;
import com.taskrunning.api.entity.Carteira;
import com.taskrunning.api.entity.Inventario;
import com.taskrunning.api.entity.Usuario;
import com.taskrunning.api.exception.ResourceNotFoundException;
import com.taskrunning.api.repository.AvatarRepository;
import com.taskrunning.api.repository.CarteiraRepository;
import com.taskrunning.api.repository.InventarioRepository;
import com.taskrunning.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GamificacaoService {

    private final CarteiraRepository carteiraRepository;
    private final AvatarRepository avatarRepository;
    private final InventarioRepository inventarioRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public CarteiraResponseDTO obterCarteira(String email) {
        Usuario usuario = buscarUsuario(email);
        Carteira carteira = buscarOuCriarCarteira(usuario);
        return new CarteiraResponseDTO(carteira.getMoedas(), carteira.getExperienciaXp(), carteira.getNivel());
    }

    @Transactional
    public List<AvatarResponseDTO> listarLojaAvatares(String email) {
        Usuario usuario = buscarUsuario(email);
        List<Avatar> avatares = avatarRepository.findAll();
        List<Inventario> inventarioUsuario = inventarioRepository.findByUsuarioId(usuario.getId());

        return avatares.stream().map(avatar -> {
            boolean adquirido = inventarioUsuario.stream()
                    .anyMatch(item -> item.getAvatar().getId().equals(avatar.getId()));
            boolean equipado = inventarioUsuario.stream()
                    .anyMatch(item -> item.getAvatar().getId().equals(avatar.getId()) && Boolean.TRUE.equals(item.getEquipado()));

            return new AvatarResponseDTO(
                    avatar.getId(),
                    avatar.getNome(),
                    avatar.getDescricao(),
                    avatar.getPrecoMoedas(),
                    avatar.getImagemUrl(),
                    avatar.getRaridade(),
                    adquirido,
                    equipado
            );
        }).toList();
    }

    @Transactional
    public CarteiraResponseDTO comprarAvatar(String email, Long avatarId) {
        Usuario usuario = buscarUsuario(email);
        Carteira carteira = buscarOuCriarCarteira(usuario);

        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new ResourceNotFoundException("Avatar não encontrado com ID: " + avatarId));

        boolean jaPossui = inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarId).isPresent();
        if (jaPossui) {
            throw new IllegalArgumentException("Você já possui este avatar em seu inventário.");
        }

        if (carteira.getMoedas() < avatar.getPrecoMoedas()) {
            throw new IllegalArgumentException("Saldo insuficiente de moedas para comprar este avatar.");
        }

        carteira.setMoedas(carteira.getMoedas() - avatar.getPrecoMoedas());
        carteiraRepository.save(carteira);

        Inventario item = new Inventario();
        item.setUsuario(usuario);
        item.setAvatar(avatar);
        item.setEquipado(false);
        item.setAdquiridoEm(LocalDateTime.now());
        inventarioRepository.save(item);

        return new CarteiraResponseDTO(carteira.getMoedas(), carteira.getExperienciaXp(), carteira.getNivel());
    }

    @Transactional
    public void equiparAvatar(String email, Long avatarId) {
        Usuario usuario = buscarUsuario(email);

        Inventario itemDesejado = inventarioRepository.findByUsuarioIdAndAvatarId(usuario.getId(), avatarId)
                .orElseThrow(() -> new ResourceNotFoundException("Você não possui este avatar no seu inventário."));

        inventarioRepository.findByUsuarioIdAndEquipadoTrue(usuario.getId())
                .ifPresent(itemAtual -> {
                    itemAtual.setEquipado(false);
                    inventarioRepository.save(itemAtual);
                });

        itemDesejado.setEquipado(true);
        inventarioRepository.save(itemDesejado);
    }

    @Transactional
    public void creditarRecompensaAtividade(Usuario usuario, int calorias, double distanciaMetros) {
        Carteira carteira = buscarOuCriarCarteira(usuario);

        int moedasGanha = (int) (distanciaMetros / 100.0);
        long xpGanho = (long) calorias;

        carteira.setMoedas(carteira.getMoedas() + moedasGanha);
        carteira.setExperienciaXp(carteira.getExperienciaXp() + xpGanho);

        int novoNivel = (int) (carteira.getExperienciaXp() / 1000) + 1;
        carteira.setNivel(novoNivel);

        carteiraRepository.save(carteira);
    }

    private Usuario buscarUsuario(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private Carteira buscarOuCriarCarteira(Usuario usuario) {
        return carteiraRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> {
                    Carteira nova = new Carteira();
                    nova.setUsuario(usuario);
                    nova.setMoedas(0);
                    nova.setExperienciaXp(0L);
                    nova.setNivel(1);
                    return carteiraRepository.save(nova);
                });
    }
}