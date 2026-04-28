package github.kaloyanov5.riglab.dto;

import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;

import java.util.List;

public record BuildResponse(
        Long id,
        String name,
        String ownerUsername,
        ComponentResponse cpu,
        ComponentResponse gpu,
        ComponentResponse motherboard,
        List<ComponentResponse> ramSticks,
        ComponentResponse psu,
        ComponentResponse pcCase,
        List<ComponentResponse> storageDevices,
        List<ComponentResponse> coolers,
        Double totalPrice,
        Integer totalPowerConsumption
) {
    public static BuildResponse fromEntity(Build build) {
        int totalPower = calculateTotalPower(build);

        return new BuildResponse(
                build.getId(),
                build.getName(),
                build.getOwner() != null ? build.getOwner().getUsername() : null,
                build.getCpu() != null ? ComponentResponse.fromEntity(build.getCpu()) : null,
                build.getGpu() != null ? ComponentResponse.fromEntity(build.getGpu()) : null,
                build.getMotherboard() != null ? ComponentResponse.fromEntity(build.getMotherboard()) : null,
                build.getRamSticks().stream().map(ComponentResponse::fromEntity).toList(),
                build.getPsu() != null ? ComponentResponse.fromEntity(build.getPsu()) : null,
                build.getPcCase() != null ? ComponentResponse.fromEntity(build.getPcCase()) : null,
                build.getStorageDevices().stream().map(ComponentResponse::fromEntity).toList(),
                build.getCoolers().stream().map(ComponentResponse::fromEntity).toList(),
                build.getTotalPrice(),
                totalPower
        );
    }

    private static int calculateTotalPower(Build build) {
        int total = 0;
        if (build.getCpu() != null && build.getCpu().getPowerConsumption() != null) {
            total += build.getCpu().getPowerConsumption();
        }
        if (build.getGpu() != null && build.getGpu().getPowerConsumption() != null) {
            total += build.getGpu().getPowerConsumption();
        }
        if (build.getMotherboard() != null && build.getMotherboard().getPowerConsumption() != null) {
            total += build.getMotherboard().getPowerConsumption();
        }
        for (Component ram : build.getRamSticks()) {
            if (ram.getPowerConsumption() != null) total += ram.getPowerConsumption();
        }
        for (Component storage : build.getStorageDevices()) {
            if (storage.getPowerConsumption() != null) total += storage.getPowerConsumption();
        }
        for (Component cooler : build.getCoolers()) {
            if (cooler.getPowerConsumption() != null) total += cooler.getPowerConsumption();
        }
        return total;
    }
}
