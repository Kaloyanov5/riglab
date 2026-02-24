package github.kaloyanov5.riglab.service;

import github.kaloyanov5.riglab.dto.ComponentRequest;
import github.kaloyanov5.riglab.dto.ComponentResponse;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import github.kaloyanov5.riglab.entity.component_details.*;
import github.kaloyanov5.riglab.exception.ResourceNotFoundException;
import github.kaloyanov5.riglab.repository.ComponentRepository;
import lombok.RequiredArgsConstructor;
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

    public List<ComponentResponse> searchComponents(String name) {
        return componentRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(ComponentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ComponentResponse createComponent(ComponentRequest request) {
        Component component = new Component();
        component.setName(request.name());
        component.setBrand(request.brand());
        component.setType(request.type());
        component.setPrice(request.price());
        component.setPowerConsumption(request.powerConsumption());

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
        component.setType(request.type());
        component.setPrice(request.price());
        component.setPowerConsumption(request.powerConsumption());

        // Clear old details if type changed
        clearDetails(component);
        applyDetails(component, request);

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
}

