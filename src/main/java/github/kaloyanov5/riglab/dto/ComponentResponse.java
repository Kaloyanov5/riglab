package github.kaloyanov5.riglab.dto;

import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import github.kaloyanov5.riglab.entity.component_details.*;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;
import java.util.LinkedHashMap;

@Schema(description = "PC Component response with type-specific details")
public record ComponentResponse(
        Long id,
        String name,
        String brand,
        ComponentType type,
        Double price,
        Integer powerConsumption,
        String imageUrl,
        @Schema(description = "Type-specific component details (varies by component type)")
        Map<String, Object> details
) {
    public static ComponentResponse fromEntity(Component component) {
        Map<String, Object> details = buildDetails(component);

        return new ComponentResponse(
                component.getId(),
                component.getName(),
                component.getBrand(),
                component.getType(),
                component.getPrice(),
                component.getPowerConsumption(),
                component.getImageUrl(),
                details.isEmpty() ? null : details
        );
    }

    private static Map<String, Object> buildDetails(Component component) {
        Map<String, Object> details = new LinkedHashMap<>();

        if (component.getCpuDetails() != null) {
            CpuDetails d = component.getCpuDetails();
            putIfNotNull(details, "socket", d.getSocket());
            putIfNotNull(details, "cores", d.getCores());
            putIfNotNull(details, "threads", d.getThreads());
            putIfNotNull(details, "baseClock", d.getBaseClock());
            putIfNotNull(details, "boostClock", d.getBoostClock());
        }

        if (component.getGpuDetails() != null) {
            GpuDetails d = component.getGpuDetails();
            putIfNotNull(details, "vram", d.getVram());
            putIfNotNull(details, "lengthMm", d.getLengthMm());
            putIfNotNull(details, "recommendedPsu", d.getRecommendedPsu());
            putIfNotNull(details, "performanceScore", d.getPerformanceScore());
        }

        if (component.getMotherboardDetails() != null) {
            MotherboardDetails d = component.getMotherboardDetails();
            putIfNotNull(details, "socket", d.getSocket());
            putIfNotNull(details, "chipset", d.getChipset());
            putIfNotNull(details, "formFactor", d.getFormFactor());
            putIfNotNull(details, "supportedRamType", d.getSupportedRamType());
            putIfNotNull(details, "ramSlots", d.getRamSlots());
            putIfNotNull(details, "m2Slots", d.getM2Slots());
            putIfNotNull(details, "sataConnectors", d.getSataConnectors());
        }

        if (component.getRamDetails() != null) {
            RamDetails d = component.getRamDetails();
            putIfNotNull(details, "capacityGb", d.getCapacityGb());
            putIfNotNull(details, "type", d.getType());
            putIfNotNull(details, "speedMhz", d.getSpeedMhz());
        }

        if (component.getPsuDetails() != null) {
            PsuDetails d = component.getPsuDetails();
            putIfNotNull(details, "wattage", d.getWattage());
            putIfNotNull(details, "efficiencyRating", d.getEfficiencyRating());
        }

        if (component.getCaseDetails() != null) {
            CaseDetails d = component.getCaseDetails();
            putIfNotNull(details, "supportedFormFactor", d.getSupportedFormFactor());
            putIfNotNull(details, "maxGpuLengthMm", d.getMaxGpuLengthMm());
        }

        if (component.getStorageDetails() != null) {
            StorageDetails d = component.getStorageDetails();
            putIfNotNull(details, "capacityGb", d.getCapacityGb());
            putIfNotNull(details, "storageType", d.getStorageType());
            putIfNotNull(details, "interfaceType", d.getInterfaceType());
            putIfNotNull(details, "readSpeedMbps", d.getReadSpeedMbps());
            putIfNotNull(details, "writeSpeedMbps", d.getWriteSpeedMbps());
        }

        if (component.getCoolerDetails() != null) {
            CoolerDetails d = component.getCoolerDetails();
            putIfNotNull(details, "coolerType", d.getCoolerType());
            putIfNotNull(details, "fanSizeMm", d.getFanSizeMm());
            putIfNotNull(details, "maxTdp", d.getMaxTdp());
            putIfNotNull(details, "supportedSockets", d.getSupportedSockets());
            putIfNotNull(details, "noiseLevel", d.getNoiseLevel());
        }

        return details;
    }

    private static void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}


