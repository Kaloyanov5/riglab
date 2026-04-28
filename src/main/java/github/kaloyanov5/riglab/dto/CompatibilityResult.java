package github.kaloyanov5.riglab.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Result of a single compatibility check")
public record CompatibilityResult(
        boolean compatible,
        List<String> reasons
) {}
