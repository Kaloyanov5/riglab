package github.kaloyanov5.riglab.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "Batch compatibility check — substitutes each candidate into the given slot of the current build and reports compatibility")
public record BatchCompatibilityRequest(
        @NotNull
        @Schema(description = "Current build selections (some slots may be empty)")
        BuildRequest current,

        @NotNull
        @Schema(description = "Slot to substitute the candidate into", example = "cpu",
                allowableValues = {"cpu", "gpu", "motherboard", "psu", "case", "cooler",
                        "ram-0", "ram-1", "ram-2", "ram-3", "storage-0", "storage-1"})
        String slot,

        @NotNull
        @Schema(description = "Candidate component IDs to test in this slot")
        List<Long> candidateIds
) {}
