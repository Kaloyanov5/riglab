package github.kaloyanov5.riglab.service;

import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import github.kaloyanov5.riglab.entity.component_details.*;
import github.kaloyanov5.riglab.exception.CompatibilityException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class CompatibilityService {

    public void validateBuildCompatibility(Build build) {
        List<String> errors = new ArrayList<>();

        validateComponentTypes(build, errors);
        validateCpuMotherboardSocket(build, errors);
        validateRamCompatibility(build, errors);
        validateFormFactorCompatibility(build, errors);
        validateGpuClearance(build, errors);
        validateStorageSlots(build, errors);
        validateCoolerSocketSupport(build, errors);
        validatePowerRequirements(build, errors);

        if (!errors.isEmpty()) {
            throw new CompatibilityException(String.join("; ", errors));
        }
    }

    private void validateComponentTypes(Build build, List<String> errors) {
        if (build.getCpu() != null && build.getCpu().getType() != ComponentType.CPU) {
            errors.add("Selected CPU component is not a CPU type");
        }
        if (build.getGpu() != null && build.getGpu().getType() != ComponentType.GPU) {
            errors.add("Selected GPU component is not a GPU type");
        }
        if (build.getMotherboard() != null && build.getMotherboard().getType() != ComponentType.MOTHERBOARD) {
            errors.add("Selected motherboard component is not a MOTHERBOARD type");
        }
        if (build.getPsu() != null && build.getPsu().getType() != ComponentType.PSU) {
            errors.add("Selected PSU component is not a PSU type");
        }
        if (build.getPcCase() != null && build.getPcCase().getType() != ComponentType.CASE) {
            errors.add("Selected case component is not a CASE type");
        }

        for (Component ram : build.getRamSticks()) {
            if (ram.getType() != ComponentType.RAM) {
                errors.add("Component '" + ram.getName() + "' is not a RAM type");
            }
        }
        for (Component storage : build.getStorageDevices()) {
            if (storage.getType() != ComponentType.STORAGE) {
                errors.add("Component '" + storage.getName() + "' is not a STORAGE type");
            }
        }
        for (Component cooler : build.getCoolers()) {
            if (cooler.getType() != ComponentType.COOLER) {
                errors.add("Component '" + cooler.getName() + "' is not a COOLER type");
            }
        }
    }

    /**
     * Validates that the CPU socket matches the motherboard socket.
     */
    private void validateCpuMotherboardSocket(Build build, List<String> errors) {
        if (build.getCpu() == null || build.getMotherboard() == null) return;

        CpuDetails cpuDetails = build.getCpu().getCpuDetails();
        MotherboardDetails mbDetails = build.getMotherboard().getMotherboardDetails();

        if (cpuDetails != null && mbDetails != null) {
            if (!cpuDetails.getSocket().equalsIgnoreCase(mbDetails.getSocket())) {
                errors.add("CPU socket (" + cpuDetails.getSocket() + ") does not match motherboard socket (" + mbDetails.getSocket() + ")");
            }
        }
    }

    /**
     * Validates RAM type compatibility with motherboard and RAM slot count.
     */
    private void validateRamCompatibility(Build build, List<String> errors) {
        if (build.getMotherboard() == null || build.getRamSticks().isEmpty()) return;

        MotherboardDetails mbDetails = build.getMotherboard().getMotherboardDetails();
        if (mbDetails == null) return;

        // Validate RAM slot count
        if (mbDetails.getRamSlots() != null && build.getRamSticks().size() > mbDetails.getRamSlots()) {
            errors.add("Too many RAM sticks (" + build.getRamSticks().size() + ") for motherboard which has " + mbDetails.getRamSlots() + " RAM slot(s)");
        }

        // Validate RAM type compatibility
        for (Component ram : build.getRamSticks()) {
            RamDetails ramDetails = ram.getRamDetails();
            if (ramDetails != null && mbDetails.getSupportedRamType() != null) {
                if (!ramDetails.getType().equalsIgnoreCase(mbDetails.getSupportedRamType())) {
                    errors.add("RAM '" + ram.getName() + "' is " + ramDetails.getType() + " but motherboard supports " + mbDetails.getSupportedRamType());
                }
            }
        }
    }

    /**
     * Validates that the motherboard form factor is supported by the case.
     */
    private void validateFormFactorCompatibility(Build build, List<String> errors) {
        if (build.getMotherboard() == null || build.getPcCase() == null) return;

        MotherboardDetails mbDetails = build.getMotherboard().getMotherboardDetails();
        CaseDetails caseDetails = build.getPcCase().getCaseDetails();

        if (mbDetails != null && caseDetails != null) {
            String mbFormFactor = mbDetails.getFormFactor();
            String caseFormFactor = caseDetails.getSupportedFormFactor();

            if (mbFormFactor != null && caseFormFactor != null) {
                List<String> supported = Arrays.stream(caseFormFactor.split(","))
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .toList();

                if (!supported.contains(mbFormFactor.trim().toUpperCase())) {
                    errors.add("Motherboard form factor (" + mbFormFactor + ") is not supported by case (supports: " + caseFormFactor + ")");
                }
            }
        }
    }

    /**
     * Validates that the GPU fits inside the case.
     */
    private void validateGpuClearance(Build build, List<String> errors) {
        if (build.getGpu() == null || build.getPcCase() == null) return;

        GpuDetails gpuDetails = build.getGpu().getGpuDetails();
        CaseDetails caseDetails = build.getPcCase().getCaseDetails();

        if (gpuDetails != null && caseDetails != null) {
            if (gpuDetails.getLengthMm() != null && caseDetails.getMaxGpuLengthMm() != null) {
                if (gpuDetails.getLengthMm() > caseDetails.getMaxGpuLengthMm()) {
                    errors.add("GPU length (" + gpuDetails.getLengthMm() + "mm) exceeds case maximum GPU clearance (" + caseDetails.getMaxGpuLengthMm() + "mm)");
                }
            }
        }
    }

    /**
     * Validates that storage devices don't exceed available motherboard slots (M.2 + SATA).
     */
    private void validateStorageSlots(Build build, List<String> errors) {
        if (build.getMotherboard() == null || build.getStorageDevices().isEmpty()) return;

        MotherboardDetails mbDetails = build.getMotherboard().getMotherboardDetails();
        if (mbDetails == null) return;

        int m2Used = 0;
        int sataUsed = 0;

        for (Component storage : build.getStorageDevices()) {
            StorageDetails sd = storage.getStorageDetails();
            if (sd != null && sd.getInterfaceType() != null) {
                String iface = sd.getInterfaceType().toUpperCase();
                if (iface.contains("M.2") || iface.contains("NVME") || iface.contains("PCIE")) {
                    m2Used++;
                } else if (iface.contains("SATA")) {
                    sataUsed++;
                }
            }
        }

        if (mbDetails.getM2Slots() != null && m2Used > mbDetails.getM2Slots()) {
            errors.add("Too many M.2/NVMe drives (" + m2Used + ") for motherboard which has " + mbDetails.getM2Slots() + " M.2 slot(s)");
        }
        if (mbDetails.getSataConnectors() != null && sataUsed > mbDetails.getSataConnectors()) {
            errors.add("Too many SATA drives (" + sataUsed + ") for motherboard which has " + mbDetails.getSataConnectors() + " SATA connector(s)");
        }
    }

    /**
     * Validates that coolers support the CPU socket type.
     */
    private void validateCoolerSocketSupport(Build build, List<String> errors) {
        if (build.getCpu() == null || build.getCoolers().isEmpty()) return;

        CpuDetails cpuDetails = build.getCpu().getCpuDetails();
        if (cpuDetails == null || cpuDetails.getSocket() == null) return;

        String cpuSocket = cpuDetails.getSocket().trim().toUpperCase();

        for (Component cooler : build.getCoolers()) {
            CoolerDetails coolerDetails = cooler.getCoolerDetails();
            if (coolerDetails != null && coolerDetails.getSupportedSockets() != null) {
                List<String> supportedSockets = Arrays.stream(coolerDetails.getSupportedSockets().split(","))
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .toList();

                if (!supportedSockets.contains(cpuSocket)) {
                    errors.add("Cooler '" + cooler.getName() + "' does not support CPU socket " + cpuDetails.getSocket() + " (supports: " + coolerDetails.getSupportedSockets() + ")");
                }
            }
        }
    }

    /**
     * Validates that PSU wattage is sufficient for total system power draw.
     * Uses GPU recommended PSU wattage if available.
     */
    private void validatePowerRequirements(Build build, List<String> errors) {
        int totalPower = calculateTotalPowerConsumption(build);

        // Check against PSU wattage from PsuDetails
        if (build.getPsu() != null) {
            PsuDetails psuDetails = build.getPsu().getPsuDetails();
            if (psuDetails != null && psuDetails.getWattage() != null) {
                if (psuDetails.getWattage() < totalPower) {
                    errors.add("PSU wattage (" + psuDetails.getWattage() + "W) is insufficient for system power draw (" + totalPower + "W). Recommended: at least " + (int)(totalPower * 1.2) + "W");
                }
            } else if (build.getPsu().getPowerConsumption() != null) {
                // Fallback to generic powerConsumption field
                if (build.getPsu().getPowerConsumption() < totalPower) {
                    errors.add("PSU wattage (" + build.getPsu().getPowerConsumption() + "W) is insufficient for system power draw (" + totalPower + "W)");
                }
            }
        }

        // Check GPU recommended PSU
        if (build.getGpu() != null) {
            GpuDetails gpuDetails = build.getGpu().getGpuDetails();
            if (gpuDetails != null && gpuDetails.getRecommendedPsu() != null && build.getPsu() != null) {
                PsuDetails psuDetails = build.getPsu().getPsuDetails();
                int psuWattage = (psuDetails != null && psuDetails.getWattage() != null)
                        ? psuDetails.getWattage()
                        : (build.getPsu().getPowerConsumption() != null ? build.getPsu().getPowerConsumption() : 0);

                if (psuWattage > 0 && psuWattage < gpuDetails.getRecommendedPsu()) {
                    errors.add("GPU recommends at least " + gpuDetails.getRecommendedPsu() + "W PSU, but current PSU is " + psuWattage + "W");
                }
            }
        }
    }

    private int calculateTotalPowerConsumption(Build build) {
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

