package com.web.nrs.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<Long> {

    @Override
    public Long resolveCurrentTenantIdentifier() {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            return tenantId;
        }
        // Return a default or system tenant ID if none is set in the context
        // E.g., for login or global queries.
        // We return 0L as a dummy default if not set, or we could handle it via global session
        return 0L;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
