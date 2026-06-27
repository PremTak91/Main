package com.web.nrs.repository;

import com.web.nrs.entity.UserRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRoleEntity, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT ur.user.id FROM UserRoleEntity ur WHERE ur.roles.roleId = :roleId")
    java.util.List<Long> findUserIdsByRoleId(@org.springframework.data.repository.query.Param("roleId") String roleId);
}
