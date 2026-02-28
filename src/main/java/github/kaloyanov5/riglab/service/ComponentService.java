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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComponentService {

    private final ComponentRepository componentRepository;

    public List<ComponentResponse> getAllComponents() {
        return componentRepository.findAll()
                .stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public List<String> getDistinctBrands(ComponentType type) {
        if (type != null) {
            return componentRepository.findDistinctBrandsByType(type);
        }
        return componentRepository.findDistinctBrands();
    }

    public Page<ComponentResponse> getAllComponentsPaged(Pageable pageable) {
        return componentRepository.findAll(pageable).map(ComponentResponse::fromEntity);
    }

    public ComponentResponse getComponentById(Long id) {
        return componentRepository.findById(id)
                .map(ComponentResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Component", id));
    }

    public List<ComponentResponse> getComponentsByType(ComponentType type) {
        return componentRepository.findByType(type)
                .stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public Page<ComponentResponse> getComponentsByTypePaged(ComponentType type, Pageable pageable) {
        return componentRepository.findByType(type, pageable).map(ComponentResponse::fromEntity);
    }

    public List<ComponentResponse> searchComponents(String name) {
        return componentRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    public Page<ComponentResponse> searchComponentsPaged(String name, ComponentType type, Double minPrice, Double maxPrice, Pageable pageable) {
        boolean hasName = name != null && !name.isBlank();
        boolean hasType = type != null;
        boolean hasPrice = minPrice != null || maxPrice != null;

        double pMin = minPrice != null ? minPrice : 0.0;
        double pMax = maxPrice != null ? maxPrice : Double.MAX_VALUE;

        if (hasType && hasName && hasPrice) {
            return componentRepository.findByTypeAndNameContainingIgnoreCaseAndPriceBetween(type, name, pMin, pMax, pageable)
                    .map(ComponentResponse::fromEntity);
        } else if (hasType && hasName) {
            return componentRepository.findByTypeAndNameContainingIgnoreCase(type, name, pageable)
                    .map(ComponentResponse::fromEntity);
        } else if (hasType && hasPrice) {
            return componentRepository.findByTypeAndPriceBetween(type, pMin, pMax, pageable)
                    .map(ComponentResponse::fromEntity);
        } else if (hasName && hasPrice) {
            return componentRepository.findByNameContainingIgnoreCaseAndPriceBetween(name, pMin, pMax, pageable)
                    .map(ComponentResponse::fromEntity);
        } else if (hasType) {
            return componentRepository.findByType(type, pageable).map(ComponentResponse::fromEntity);
        } else if (hasName) {
            return componentRepository.findByNameContainingIgnoreCase(name, pageable)
                    .map(ComponentResponse::fromEntity);
        } else if (hasPrice) {
            return componentRepository.findByPriceBetween(pMin, pMax, pageable)
                    .map(ComponentResponse::fromEntity);
        }
        return componentRepository.findAll(pageable).map(ComponentResponse::fromEntity);
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

        Component saved = componentRepository.save(component);
        return ComponentResponse.fromEntity(saved);
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

        // If type changed, clear old details first
        if (component.getType() != request.type()) {
            clearDetails(component);
            componentRepository.saveAndFlush(component);
            component.setType(request.type());
        }

        updateDetails(component, request);

        Component saved = componentRepository.save(component);
        return ComponentResponse.fromEntity(saved);
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

    private void applyDetails(Component component, ComponentRequest request) {
        switch (request.type()) {
            case CPU -> {
                if (request.cpuSocket() != null) {
                    CpuDetails details = new CpuDetails();
                    details.setComponent(component);
                    details.setSocket(request.cpuSocket());
                    details.setCores(request.cpuCores());
                    details.setThreads(request.cpuThreads());
                    details.setBaseClock(request.cpuBaseClock());
                    details.setBoostClock(request.cpuBoostClock());
                    component.setCpuDetails(details);
                }
            }
            case GPU -> {
                if (request.gpuVram() != null || request.gpuLengthMm() != null) {
                    GpuDetails details = new GpuDetails();
                    details.setComponent(component);
                    details.setVram(request.gpuVram());
                    details.setLengthMm(request.gpuLengthMm());
                    details.setRecommendedPsu(request.gpuRecommendedPsu());
                    details.setPerformanceScore(request.gpuPerformanceScore());
                    component.setGpuDetails(details);
                }
            }
            case MOTHERBOARD -> {
                if (request.mbSocket() != null) {
                    MotherboardDetails details = new MotherboardDetails();
                    details.setComponent(component);
                    details.setSocket(request.mbSocket());
                    details.setChipset(request.mbChipset());
                    details.setFormFactor(request.mbFormFactor());
                    details.setSupportedRamType(request.mbSupportedRamType());
                    details.setRamSlots(request.mbRamSlots());
                    details.setM2Slots(request.mbM2Slots());
                    details.setSataConnectors(request.mbSataConnectors());
                    component.setMotherboardDetails(details);
                }
            }
            case RAM -> {
                if (request.ramType() != null) {
                    RamDetails details = new RamDetails();
                    details.setComponent(component);
                    details.setCapacityGb(request.ramCapacityGb());
                    details.setType(request.ramType());
                    details.setSpeedMhz(request.ramSpeedMhz());
                    component.setRamDetails(details);
                }
            }
            case PSU -> {
                if (request.psuWattage() != null) {
                    PsuDetails details = new PsuDetails();
                    details.setComponent(component);
                    details.setWattage(request.psuWattage());
                    details.setEfficiencyRating(request.psuEfficiencyRating());
                    component.setPsuDetails(details);
                }
            }
            case CASE -> {
                if (request.caseSupportedFormFactor() != null) {
                    CaseDetails details = new CaseDetails();
                    details.setComponent(component);
                    details.setSupportedFormFactor(request.caseSupportedFormFactor());
                    details.setMaxGpuLengthMm(request.caseMaxGpuLengthMm());
                    component.setCaseDetails(details);
                }
            }
            case STORAGE -> {
                if (request.storageType() != null) {
                    StorageDetails details = new StorageDetails();
                    details.setComponent(component);
                    details.setCapacityGb(request.storageCapacityGb());
                    details.setStorageType(request.storageType());
                    details.setInterfaceType(request.storageInterfaceType());
                    details.setReadSpeedMbps(request.storageReadSpeedMbps());
                    details.setWriteSpeedMbps(request.storageWriteSpeedMbps());
                    component.setStorageDetails(details);
                }
            }
            case COOLER -> {
                if (request.coolerType() != null) {
                    CoolerDetails details = new CoolerDetails();
                    details.setComponent(component);
                    details.setCoolerType(request.coolerType());
                    details.setFanSizeMm(request.coolerFanSizeMm());
                    details.setMaxTdp(request.coolerMaxTdp());
                    details.setSupportedSockets(request.coolerSupportedSockets());
                    details.setNoiseLevel(request.coolerNoiseLevel());
                    component.setCoolerDetails(details);
                }
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

    private void updateDetails(Component component, ComponentRequest request) {
        switch (request.type()) {
            case CPU -> {
                if (request.cpuSocket() != null) {
                    CpuDetails details = component.getCpuDetails();
                    if (details == null) {
                        details = new CpuDetails();
                        details.setComponent(component);
                        component.setCpuDetails(details);
                    }
                    details.setSocket(request.cpuSocket());
                    details.setCores(request.cpuCores());
                    details.setThreads(request.cpuThreads());
                    details.setBaseClock(request.cpuBaseClock());
                    details.setBoostClock(request.cpuBoostClock());
                }
            }
            case GPU -> {
                if (request.gpuVram() != null || request.gpuLengthMm() != null) {
                    GpuDetails details = component.getGpuDetails();
                    if (details == null) {
                        details = new GpuDetails();
                        details.setComponent(component);
                        component.setGpuDetails(details);
                    }
                    details.setVram(request.gpuVram());
                    details.setLengthMm(request.gpuLengthMm());
                    details.setRecommendedPsu(request.gpuRecommendedPsu());
                    details.setPerformanceScore(request.gpuPerformanceScore());
                }
            }
            case MOTHERBOARD -> {
                if (request.mbSocket() != null) {
                    MotherboardDetails details = component.getMotherboardDetails();
                    if (details == null) {
                        details = new MotherboardDetails();
                        details.setComponent(component);
                        component.setMotherboardDetails(details);
                    }
                    details.setSocket(request.mbSocket());
                    details.setChipset(request.mbChipset());
                    details.setFormFactor(request.mbFormFactor());
                    details.setSupportedRamType(request.mbSupportedRamType());
                    details.setRamSlots(request.mbRamSlots());
                    details.setM2Slots(request.mbM2Slots());
                    details.setSataConnectors(request.mbSataConnectors());
                }
            }
            case RAM -> {
                if (request.ramType() != null) {
                    RamDetails details = component.getRamDetails();
                    if (details == null) {
                        details = new RamDetails();
                        details.setComponent(component);
                        component.setRamDetails(details);
                    }
                    details.setCapacityGb(request.ramCapacityGb());
                    details.setType(request.ramType());
                    details.setSpeedMhz(request.ramSpeedMhz());
                }
            }
            case PSU -> {
                if (request.psuWattage() != null) {
                    PsuDetails details = component.getPsuDetails();
                    if (details == null) {
                        details = new PsuDetails();
                        details.setComponent(component);
                        component.setPsuDetails(details);
                    }
                    details.setWattage(request.psuWattage());
                    details.setEfficiencyRating(request.psuEfficiencyRating());
                }
            }
            case CASE -> {
                if (request.caseSupportedFormFactor() != null) {
                    CaseDetails details = component.getCaseDetails();
                    if (details == null) {
                        details = new CaseDetails();
                        details.setComponent(component);
                        component.setCaseDetails(details);
                    }
                    details.setSupportedFormFactor(request.caseSupportedFormFactor());
                    details.setMaxGpuLengthMm(request.caseMaxGpuLengthMm());
                }
            }
            case STORAGE -> {
                if (request.storageType() != null) {
                    StorageDetails details = component.getStorageDetails();
                    if (details == null) {
                        details = new StorageDetails();
                        details.setComponent(component);
                        component.setStorageDetails(details);
                    }
                    details.setCapacityGb(request.storageCapacityGb());
                    details.setStorageType(request.storageType());
                    details.setInterfaceType(request.storageInterfaceType());
                    details.setReadSpeedMbps(request.storageReadSpeedMbps());
                    details.setWriteSpeedMbps(request.storageWriteSpeedMbps());
                }
            }
            case COOLER -> {
                if (request.coolerType() != null) {
                    CoolerDetails details = component.getCoolerDetails();
                    if (details == null) {
                        details = new CoolerDetails();
                        details.setComponent(component);
                        component.setCoolerDetails(details);
                    }
                    details.setCoolerType(request.coolerType());
                    details.setFanSizeMm(request.coolerFanSizeMm());
                    details.setMaxTdp(request.coolerMaxTdp());
                    details.setSupportedSockets(request.coolerSupportedSockets());
                    details.setNoiseLevel(request.coolerNoiseLevel());
                }
            }
        }
    }
}

