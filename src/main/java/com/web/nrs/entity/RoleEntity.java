package com.web.nrs.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Access(AccessType.FIELD)
public class RoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_id", nullable = false, unique = true)
    private String roleId;

    @Column
    private String description;

    @Column(nullable = false)
    private Integer priority;

    @OneToMany(
        mappedBy = "roles",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY
    )
    @JsonIgnore
    private Set<UserRoleEntity> userRoles = new HashSet<>();
}