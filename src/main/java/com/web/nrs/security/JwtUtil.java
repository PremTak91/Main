package com.web.nrs.security;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.entity.UserRoleEntity;

import com.web.nrs.repository.RoleRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class JwtUtil {
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;
    @Value("${jwt.secret}")
    private String secret;
    private Key key;
    @Autowired
    RoleRepository roleRepository;

    @PostConstruct
    public void initKey() {
        key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, Set<UserRoleEntity> userRoles, Optional<EmployeeEntity> employeeEntity) {

        String userName = employeeEntity.isPresent() ? getUserName(employeeEntity.get().getFirstName(), employeeEntity.get().getMiddleName(), employeeEntity.get().getLastName()) : "";
        List<String> roles = userRoles.stream()
                .map(ur -> "ROLE_" + ur.getRoles().getRoleId().toUpperCase()) // since roleId = roleName
                .toList();
        return Jwts.builder()
                .setSubject(username)
                .claim("roles", roles)
                .claim("userName", userName)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS256, key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException e) {
            return null;
        }
    }


    public static Authentication getAuthUser(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            return auth;
        }
        return null;
    }
    public Set<String> getRolesFromToken(String token) {
        Authentication auth = getAuthUser();
        if(null == auth){
            return Set.of();
        }
        return auth.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }


    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // token invalid, expired, or signature issue
            return false;
        }
    }

    private String getUserName(String firstName, String middleName, String lastName){
        return Stream.of(firstName, middleName, lastName)
                .filter(s -> s != null && !s.isBlank()) // remove null or empty
                .collect(Collectors.joining(" "));
    }


    public static String getUserEmailFromToken() {
        Authentication auth = getAuthUser();
        if(null == auth){
            return "";
        }
        return auth.getName();
    }
}