package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_roles")
@Access(AccessType.FIELD)
public class UserRoleEntity {

    @EmbeddedId
    private UserRoleId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")                 // maps to UserRoleId.userId
    @JoinColumn(name = "user_id")
    private LoginEntity user;           // <-- owner of user_id FK

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roleId")                 // maps to UserRoleId.roleId
    @JoinColumn(name = "role_id")
    private RoleEntity roles;
}
