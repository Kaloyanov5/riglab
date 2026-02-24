package github.kaloyanov5.riglab.dto;

import github.kaloyanov5.riglab.entity.ComponentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Schema(description = "Request to create or update a PC component")
public record ComponentRequest(
        @NotBlank(message = "Name is required")
        @Schema(description = "Component name", example = "AMD Ryzen 7 7800X3D")
        String name,

        @NotBlank(message = "Brand is required")
        @Schema(description = "Component brand", example = "AMD")
        String brand,

        @NotNull(message = "Component type is required")
        @Schema(description = "Component type", example = "CPU")
        ComponentType type,

        @Positive(message = "Price must be positive")
        @Schema(description = "Price in USD", example = "349.99")
        Double price,

        @PositiveOrZero(message = "Power consumption must be zero or positive")
        @Schema(description = "Power consumption in watts (for PSU this is the output wattage)", example = "120")
        Integer powerConsumption,

        @Schema(description = "Image URL for the component", example = "https://example.com/images/cpu.png")
        String imageUrl,

        // CPU-specific details
        @Schema(description = "CPU socket type", example = "AM5")
        String cpuSocket,
        @Schema(description = "CPU core count", example = "8")
        Integer cpuCores,
        @Schema(description = "CPU thread count", example = "16")
        Integer cpuThreads,
        @Schema(description = "CPU base clock in GHz", example = "4.2")
        Double cpuBaseClock,
        @Schema(description = "CPU boost clock in GHz", example = "5.0")
        Double cpuBoostClock,

        // GPU-specific details
        @Schema(description = "GPU VRAM in GB", example = "16")
        Integer gpuVram,
        @Schema(description = "GPU card length in mm", example = "336")
        Integer gpuLengthMm,
        @Schema(description = "GPU recommended PSU wattage", example = "700")
        Integer gpuRecommendedPsu,
        @Schema(description = "GPU performance score (benchmark)", example = "25000")
        Integer gpuPerformanceScore,

        // Motherboard-specific details
        @Schema(description = "Motherboard CPU socket", example = "AM5")
        String mbSocket,
        @Schema(description = "Motherboard chipset", example = "X670E")
        String mbChipset,
        @Schema(description = "Motherboard form factor", example = "ATX")
        String mbFormFactor,
        @Schema(description = "Supported RAM type", example = "DDR5")
        String mbSupportedRamType,
        @Schema(description = "Number of RAM slots", example = "4")
        Integer mbRamSlots,
        @Schema(description = "Number of M.2 slots", example = "2")
        Integer mbM2Slots,
        @Schema(description = "Number of SATA connectors", example = "6")
        Integer mbSataConnectors,

        // RAM-specific details
        @Schema(description = "RAM capacity in GB", example = "16")
        Integer ramCapacityGb,
        @Schema(description = "RAM type", example = "DDR5")
        String ramType,
        @Schema(description = "RAM speed in MHz", example = "6000")
        Integer ramSpeedMhz,

        // PSU-specific details
        @Schema(description = "PSU wattage output", example = "850")
        Integer psuWattage,
        @Schema(description = "PSU efficiency rating", example = "80+ Gold")
        String psuEfficiencyRating,

        // Case-specific details
        @Schema(description = "Supported motherboard form factors (comma-separated)", example = "ATX, Micro-ATX, Mini-ITX")
        String caseSupportedFormFactor,
        @Schema(description = "Maximum GPU length in mm", example = "400")
        Integer caseMaxGpuLengthMm,

        // Storage-specific details
        @Schema(description = "Storage capacity in GB", example = "1000")
        Integer storageCapacityGb,
        @Schema(description = "Storage type", example = "NVMe")
        String storageType,
        @Schema(description = "Storage interface type", example = "M.2")
        String storageInterfaceType,
        @Schema(description = "Storage read speed in MB/s", example = "7000")
        Integer storageReadSpeedMbps,
        @Schema(description = "Storage write speed in MB/s", example = "5000")
        Integer storageWriteSpeedMbps,

        // Cooler-specific details
        @Schema(description = "Cooler type", example = "AIO Liquid")
        String coolerType,
        @Schema(description = "Fan size in mm", example = "120")
        Integer coolerFanSizeMm,
        @Schema(description = "Max TDP supported in watts", example = "250")
        Integer coolerMaxTdp,
        @Schema(description = "Supported CPU sockets (comma-separated)", example = "AM4, AM5, LGA1700")
        String coolerSupportedSockets,
        @Schema(description = "Noise level in dB", example = "30")
        Integer coolerNoiseLevel
) {}



