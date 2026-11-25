package com.taskrunning.api.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "logs_auditoria_atividade")
public class LogAuditoriaAtividade extends LogAuditoriaBase {}
