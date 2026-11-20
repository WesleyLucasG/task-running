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

    public static final int XP_POR_KM = 100; // RN10
    public static final int MOEDAS_POR_KM = 50; // RN10
    public static final int XP_POR_100ML = 10; // RN10

    /** RF19: nível pelo XP total — mesma curva para corrida, hidratação e abates (ver RegrasAvatar). */
    public static int calcularNivel(long xpTotal) {
        return com.taskrunning.api.util.RegrasAvatar.nivelPorXp(xpTotal);
    }

    /** RN10: XP da hidratação (100 ml = 10 XP). */
    @Transactional
    public void creditarXpHidratacao(Usuario usuario, int quantidadeMl) {
        long xp = (long) (Math.max(0, quantidadeMl) / 100) * XP_POR_100ML;
        if (xp <= 0) return;
        creditar(usuario, xp, 0);
    }

    /**
     * Ponto único de crédito de XP e moedas (RF18/RF19 e extensões do RPG). Trava a carteira do usuário
     * até o fim da transação e recalcula o nível pelo XP total.
     */
    @Transactional
    public Carteira creditar(Usuario usuario, long xp, int moedas) {
        Carteira carteira = carteiraTravada(usuario);
        carteira.setExperienciaXp(carteira.getExperienciaXp() + Math.max(0, xp));
        carteira.setMoedas(carteira.getMoedas() + Math.max(0, moedas));
        carteira.setNivel(calcularNivel(carteira.getExperienciaXp()));
        return carteiraRepository.save(carteira);
    }

    /** Carteira com trava de escrita (cria se ainda não existir). */
    @Transactional
    public Carteira carteiraTravada(Usuario usuario) {
        usuarioRepository.travarLinha(usuario.getId()); // existe sempre: protege também a criação da carteira
        return carteiraRepository.travarPorUsuarioId(usuario.getId()).orElseGet(() -> buscarOuCriarCarteira(usuario));
    }

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
        // RN10: 1 km = 100 XP e 50 moedas, multiplicados por (1 + agilidade x 0,005), bônus máximo 50%.
        // A agilidade é a do nível ANTES desta corrida (itens não dão agilidade, então não há dupla soma).
        Carteira carteira = carteiraTravada(usuario);
        double multiplicador = multiplicadorRn10(calcularNivel(carteira.getExperienciaXp()));
        double km = Math.max(0, distanciaMetros) / 1000.0;
        int moedasGanha = (int) Math.floor(km * MOEDAS_POR_KM * multiplicador + 1e-9);
        long xpGanho = (long) Math.floor(km * XP_POR_KM * multiplicador + 1e-9);
        creditar(usuario, xpGanho, moedasGanha);
    }

    /** RN10: 1 + agilidade x 0,005, limitado a 1,5 (agilidade >= 100). */
    public static double multiplicadorRn10(int nivel) {
        int agilidade = com.taskrunning.api.util.RegrasAvatar.agilidade(nivel);
        return 1.0 + Math.min(agilidade, 100) * 0.005;
    }

    private Usuario buscarUsuario(String cpf) {
        return usuarioRepository.findByCpfAndAtivoTrue(cpf)
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