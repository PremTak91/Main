package com.web.nrs.entity;

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

    @OneToMany(
        mappedBy = "roles",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY
    )
    private Set<UserRoleEntity> userRoles = new HashSet<>();
}