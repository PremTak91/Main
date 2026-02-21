package com.web.nrs.service;

import com.web.nrs.DTO.RolesPermissionsDTO;
import com.web.nrs.entity.RoleEntity;

import java.util.List;
import java.util.Map;

public interface RolesPermissionsService {
    List<RolesPermissionsDTO> getManageableUsers();
    List<RolesPermissionsDTO> getAssignableEmployees();
    List<RoleEntity> getAssignableRoles();
    List<RoleEntity> getAllRoles();
    void saveOrUpdateRole(RoleEntity role);
    void deleteRole(Long id);
    void assignRoles(Long employeeId, List<Long> roleIds);
}
