package com.web.nrs.service;

import com.web.nrs.entity.CompanyModuleEntity;
import com.web.nrs.repository.CompanyModuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CompanyModuleService {

    @Autowired
    private CompanyModuleRepository moduleRepository;

    private static final String[] DEFAULT_MODULES = {
        "EMPLOYEES",
        "ATTENDANCE",
        "ATTENDANCE_PUNCH",
        "POST_ACTIVITY",
        "LEAVE",
        "EXPENSES",
        "QUOTATIONS",
        "INQUIRIES",
        "SOLAR_SITES",
        "WORK_UPDATES",
        "DOCUMENTS"
    };

    public Set<String> getEnabledModules(Long companyId) {
        return getAllModules(companyId).stream()
                .filter(CompanyModuleEntity::isEnabled)
                .map(CompanyModuleEntity::getModuleCode)
                .collect(Collectors.toSet());
    }
    
    @Transactional
    public List<CompanyModuleEntity> getAllModules(Long companyId) {
        List<CompanyModuleEntity> existing = moduleRepository.findByCompanyId(companyId);
        Set<String> existingCodes = existing.stream()
                .map(CompanyModuleEntity::getModuleCode)
                .collect(Collectors.toSet());
        for (String code : DEFAULT_MODULES) {
            if (!existingCodes.contains(code)) {
                CompanyModuleEntity m = new CompanyModuleEntity();
                m.setCompanyId(companyId);
                m.setModuleCode(code);
                m.setEnabled(true);
                moduleRepository.save(m);
                existing.add(m);
            }
        }
        return existing;
    }

    @Transactional
    public void updateModules(Long companyId, Map<String, Boolean> moduleUpdates) {
        for (Map.Entry<String, Boolean> entry : moduleUpdates.entrySet()) {
            String code = entry.getKey();
            Boolean enabled = entry.getValue();
            
            CompanyModuleEntity module = moduleRepository.findByCompanyIdAndModuleCode(companyId, code)
                    .orElseGet(() -> {
                        CompanyModuleEntity m = new CompanyModuleEntity();
                        m.setCompanyId(companyId);
                        m.setModuleCode(code);
                        return m;
                    });
            module.setEnabled(enabled);
            moduleRepository.save(module);
        }
    }
    
    @Transactional
    public void createDefaultModules(Long companyId) {
        for (String code : DEFAULT_MODULES) {
            CompanyModuleEntity m = new CompanyModuleEntity();
            m.setCompanyId(companyId);
            m.setModuleCode(code);
            m.setEnabled(true);
            moduleRepository.save(m);
        }
    }
}
