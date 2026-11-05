package com.taskrunning.api.repository;

import com.taskrunning.api.entity.PontoGps;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PontoGpsRepository extends JpaRepository<PontoGps, Long> {

    List<PontoGps> findByAtividadeIdOrderByTimestampAsc(Long atividadeId);
}