package github.kaloyanov5.riglab.service;

import github.kaloyanov5.riglab.dto.ComponentRequest;
import github.kaloyanov5.riglab.dto.ComponentResponse;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import github.kaloyanov5.riglab.entity.component_details.*;
import github.kaloyanov5.riglab.exception.ResourceNotFoundException;
import github.kaloyanov5.riglab.repository.ComponentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComponentService {

    private final ComponentRepository componentRepository;

    public List<ComponentResponse> getAllComponents() {
        return componentRepository.findAll().stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public List<String> getDistinctBrands(ComponentType type) {
        return type != null
                ? componentRepository.findDistinctBrandsByType(type)
                : componentRepository.findDistinctBrands();
    }

    public ComponentResponse getComponentById(Long id) {
        return componentRepository.findById(id)
                .map(ComponentResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Component", id));
    }

    public List<ComponentResponse> getComponentsByType(ComponentType type) {
        return componentRepository.findByType(type).stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public List<ComponentResponse> searchComponents(String name) {
        return componentRepository.findByNameContainingIgnoreCase(name).stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public Page<ComponentResponse> searchComponentsPaged(String name, ComponentType type,
                                                        Double minPrice, Double maxPrice,
                                                        Pageable pageable) {
        Specification<Component> spec = (root, q, cb) -> cb.conjunction();
        if (type != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), type));
        }
        if (name != null && !name.isBlank()) {
            String like = "%" + name.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("name")), like));
        }
        if (minPrice != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }
        return componentRepository.findAll(spec, pageable).map(ComponentResponse::fromEntity);
    }

    @Transactional
    public ComponentResponse createComponent(ComponentRequest request) {
        Component component = new Component();
        component.setName(request.name());
        component.setBrand(request.brand());
        component.setType(request.type());
        component.setPrice(request.price());
        component.setPowerConsumption(request.powerConsumption());
        component.setImageUrl(request.imageUrl());

        applyDetails(component, request);

        return ComponentResponse.fromEntity(componentRepository.save(component));
    }

    @Transactional
    public ComponentResponse updateComponent(Long id, ComponentRequest request) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component", id));

        component.setName(request.name());
        component.setBrand(request.brand());
        component.setPrice(request.price());
        component.setPowerConsumption(request.powerConsumption());
        component.setImageUrl(request.imageUrl());

        if (component.getType() != request.type()) {
            clearDetails(component);
            componentRepository.saveAndFlush(component);
            component.setType(request.type());
        }

        applyDetails(component, request);

        return ComponentResponse.fromEntity(componentRepository.save(component));
    }

    @Transactional
    public void deleteComponent(Long id) {
        if (!componentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Component", id);
        }
        componentRepository.deleteById(id);
    }

    public Component getComponentEntity(Long id) {
        return componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component", id));
    }

    /**
     * Idempotently sets the type-specific details. If a details row already exists, it is updated;
     * otherwise a new one is created. Used by both create and update paths.
     */
    private void applyDetails(Component component, ComponentRequest request) {
        switch (request.type()) {
            case CPU -> {
                if (request.cpuSocket() == null) return;
                CpuDetails d = component.getCpuDetails() != null ? component.getCpuDetails() : new CpuDetails();
                d.setComponent(component);
                d.setSocket(request.cpuSocket());
                d.setCores(request.cpuCores());
                d.setThreads(request.cpuThreads());
                d.setBaseClock(request.cpuBaseClock());
                d.setBoostClock(request.cpuBoostClock());
                component.setCpuDetails(d);
            }
            case GPU -> {
                if (request.gpuVram() == null && request.gpuLengthMm() == null) return;
                GpuDetails d = component.getGpuDetails() != null ? component.getGpuDetails() : new GpuDetails();
                d.setComponent(component);
                d.setVram(request.gpuVram());
                d.setLengthMm(request.gpuLengthMm());
                d.setRecommendedPsu(request.gpuRecommendedPsu());
                d.setPerformanceScore(request.gpuPerformanceScore());
                component.setGpuDetails(d);
            }
            case MOTHERBOARD -> {
                if (request.mbSocket() == null) return;
                MotherboardDetails d = component.getMotherboardDetails() != null ? component.getMotherboardDetails() : new MotherboardDetails();
                d.setComponent(component);
                d.setSocket(request.mbSocket());
                d.setChipset(request.mbChipset());
                d.setFormFactor(request.mbFormFactor());
                d.setSupportedRamType(request.mbSupportedRamType());
                d.setRamSlots(request.mbRamSlots());
                d.setM2Slots(request.mbM2Slots());
                d.setSataConnectors(request.mbSataConnectors());
                component.setMotherboardDetails(d);
            }
            case RAM -> {
                if (request.ramType() == null) return;
                RamDetails d = component.getRamDetails() != null ? component.getRamDetails() : new RamDetails();
                d.setComponent(component);
                d.setCapacityGb(request.ramCapacityGb());
                d.setType(request.ramType());
                d.setSpeedMhz(request.ramSpeedMhz());
                component.setRamDetails(d);
            }
            case PSU -> {
                if (request.psuWattage() == null) return;
                PsuDetails d = component.getPsuDetails() != null ? component.getPsuDetails() : new PsuDetails();
                d.setComponent(component);
                d.setWattage(request.psuWattage());
                d.setEfficiencyRating(request.psuEfficiencyRating());
                component.setPsuDetails(d);
            }
            case CASE -> {
                if (request.caseSupportedFormFactor() == null) return;
                CaseDetails d = component.getCaseDetails() != null ? component.getCaseDetails() : new CaseDetails();
                d.setComponent(component);
                d.setSupportedFormFactor(request.caseSupportedFormFactor());
                d.setMaxGpuLengthMm(request.caseMaxGpuLengthMm());
                component.setCaseDetails(d);
            }
            case STORAGE -> {
                if (request.storageType() == null) return;
                StorageDetails d = component.getStorageDetails() != null ? component.getStorageDetails() : new StorageDetails();
                d.setComponent(component);
                d.setCapacityGb(request.storageCapacityGb());
                d.setStorageType(request.storageType());
                d.setInterfaceType(request.storageInterfaceType());
                d.setReadSpeedMbps(request.storageReadSpeedMbps());
                d.setWriteSpeedMbps(request.storageWriteSpeedMbps());
                component.setStorageDetails(d);
            }
            case COOLER -> {
                if (request.coolerType() == null) return;
                CoolerDetails d = component.getCoolerDetails() != null ? component.getCoolerDetails() : new CoolerDetails();
                d.setComponent(component);
                d.setCoolerType(request.coolerType());
                d.setFanSizeMm(request.coolerFanSizeMm());
                d.setMaxTdp(request.coolerMaxTdp());
                d.setSupportedSockets(request.coolerSupportedSockets());
                d.setNoiseLevel(request.coolerNoiseLevel());
                component.setCoolerDetails(d);
            }
        }
    }

    private void clearDetails(Component component) {
        component.setCpuDetails(null);
        component.setGpuDetails(null);
        component.setMotherboardDetails(null);
        component.setRamDetails(null);
        component.setPsuDetails(null);
        component.setCaseDetails(null);
        component.setStorageDetails(null);
        component.setCoolerDetails(null);
    }
}
