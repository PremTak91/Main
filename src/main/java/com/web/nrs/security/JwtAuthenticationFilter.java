package com.web.nrs.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // Skip static resources and public endpoints
        if (path.startsWith("/css/") || path.startsWith("/js/") ||
                path.startsWith("/images/") || path.startsWith("/webjars/") ||
                path.equals("/login") || path.startsWith("/login/") ||
                path.equals("/registration") || path.startsWith("/registration/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = null;
        String username = null;

        // 1️⃣ Try to get token from Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2️⃣ If not in header, check cookies
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwtToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // 3️⃣ If a token was found, validate it
        if (token != null) {
            if (!jwtUtil.validateToken(token)) {
                // Token is expired or invalid — clear the cookie
                clearJwtCookie(response);

                // Determine if this is an AJAX/API request or a page navigation
                if (isAjaxRequest(request)) {
                    // Return 401 JSON — frontend interceptor will redirect
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Session expired. Please log in again.\", \"expired\": true}");
                    return;
                } else {
                    // Full page request — redirect to login with expired flag
                    response.sendRedirect(request.getContextPath() + "/login?expired=true");
                    return;
                }
            }

            // 4️⃣ Token is valid — extract username and set authentication
            username = jwtUtil.getUsernameFromToken(token);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Determine if the incoming request is an AJAX/fetch/API call.
     * Checks X-Requested-With header and Accept header.
     */
    private boolean isAjaxRequest(HttpServletRequest request) {
        String xRequestedWith = request.getHeader("X-Requested-With");
        String acceptHeader = request.getHeader("Accept");
        return "XMLHttpRequest".equalsIgnoreCase(xRequestedWith)
                || (acceptHeader != null && acceptHeader.contains("application/json"));
    }

    /**
     * Clear the JWT cookie by setting Max-Age to 0.
     */
    private void clearJwtCookie(HttpServletResponse response) {
        Cookie expired = new Cookie("jwtToken", null);
        expired.setHttpOnly(true);
        expired.setSecure(true);
        expired.setPath("/");
        expired.setMaxAge(0);
        response.addCookie(expired);
    }
}
