package com.web.nrs.security;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private LoginService userService;

    @Autowired
    private com.web.nrs.repository.CompanyRepository companyRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        LoginEntity user = userService.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        boolean isSuperAdmin = user.getUserRoles().stream()
                .anyMatch(role -> "SUPERADMIN".equals(role.getRoles().getRoleId()));

        if (user.getCompanyId() != null && !isSuperAdmin) {
            com.web.nrs.entity.CompanyEntity company = companyRepository.findById(user.getCompanyId())
                    .orElse(null);
            if (company != null) {
                if (company.isDeleted()) {
                    throw new org.springframework.security.authentication.DisabledException("Company has been deleted");
                }
                if ("INACTIVE".equalsIgnoreCase(company.getStatus())) {
                    throw new org.springframework.security.authentication.DisabledException("Company account is deactivated");
                }
            }
        }

        Set<GrantedAuthority> authorities = user.getUserRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoles().getRoleId()))
                .collect(Collectors.toSet());
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
}
