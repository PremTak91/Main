package com.web.nrs.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@Setter
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