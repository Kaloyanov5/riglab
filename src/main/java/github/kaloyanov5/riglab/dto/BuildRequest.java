package github.kaloyanov5.riglab.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "Request to create or update a PC build configuration")
public record BuildRequest(
        @NotBlank(message = "Build name is required")
        @Schema(description = "Name for this build", example = "Gaming Beast")
        String name,

        @NotNull(message = "CPU is required")
        @Schema(description = "CPU component ID", example = "1")
        Long cpuId,

        @Schema(description = "GPU component ID (optional for integrated graphics)", example = "2")
        Long gpuId,

        @NotNull(message = "Motherboard is required")
        @Schema(description = "Motherboard component ID", example = "3")
        Long motherboardId,

        @NotNull(message = "At least one RAM stick is required")
        @Schema(description = "List of RAM component IDs", example = "[4, 5]")
        List<Long> ramIds,

        @NotNull(message = "PSU is required")
        @Schema(description = "PSU component ID", example = "6")
        Long psuId,

        @NotNull(message = "Case is required")
        @Schema(description = "Case component ID", example = "7")
        Long caseId,

        @Schema(description = "List of storage component IDs (HDD, SSD, NVMe)")
        List<Long> storageIds,

        @Schema(description = "List of cooler component IDs")
        List<Long> coolerIds
) {}

