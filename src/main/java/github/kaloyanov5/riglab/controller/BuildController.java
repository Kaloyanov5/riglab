package github.kaloyanov5.riglab.controller;

import github.kaloyanov5.riglab.dto.BatchCompatibilityRequest;
import github.kaloyanov5.riglab.dto.BuildRequest;
import github.kaloyanov5.riglab.dto.BuildResponse;
import github.kaloyanov5.riglab.dto.CompatibilityResult;
import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.exception.ResourceNotFoundException;
import github.kaloyanov5.riglab.service.BuildService;
import github.kaloyanov5.riglab.service.CompatibilityService;
import github.kaloyanov5.riglab.service.ComponentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/builds")
@RequiredArgsConstructor
@Tag(name = "Builds", description = "PC Build configuration management - create, update, and validate complete PC builds")
public class BuildController {

    private final BuildService buildService;
    private final CompatibilityService compatibilityService;
    private final ComponentService componentService;

    @GetMapping
    @Operation(summary = "Get all builds (admin/debug)")
    public ResponseEntity<List<BuildResponse>> getAllBuilds() {
        return ResponseEntity.ok(buildService.getAllBuilds());
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user's saved builds")
    public ResponseEntity<List<BuildResponse>> getMyBuilds(Authentication authentication) {
        return ResponseEntity.ok(buildService.getMyBuilds(authentication.getName()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get build by ID")
    public ResponseEntity<BuildResponse> getBuildById(@Parameter(description = "Build ID") @PathVariable Long id) {
        return ResponseEntity.ok(buildService.getBuildById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new build", description = "Saves a new build owned by the current user. Validates compatibility.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Build created"),
            @ApiResponse(responseCode = "400", description = "Validation or compatibility error"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<BuildResponse> createBuild(@Valid @RequestBody BuildRequest request,
                                                     Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(buildService.createBuild(request, username));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a build (must be owner)")
    public ResponseEntity<BuildResponse> updateBuild(@PathVariable Long id,
                                                     @Valid @RequestBody BuildRequest request,
                                                     Authentication authentication) {
        return ResponseEntity.ok(buildService.updateBuild(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a build (must be owner)")
    public ResponseEntity<Void> deleteBuild(@PathVariable Long id, Authentication authentication) {
        buildService.deleteBuild(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-compatibility")
    @Operation(summary = "Check build compatibility (no save)")
    public ResponseEntity<Map<String, Object>> checkCompatibility(@RequestBody BuildRequest request) {
        Build build = buildService.buildFromRequest(request);
        List<String> errors = compatibilityService.checkBuildCompatibility(build);
        return ResponseEntity.ok(Map.of("compatible", errors.isEmpty(), "errors", errors));
    }

    @PostMapping("/check-compatibility/batch")
    @Operation(summary = "Batch compatibility check",
            description = "Substitutes each candidate ID into the given slot of the current build and reports whether each candidate is compatible. One round-trip instead of N.")
    public ResponseEntity<Map<Long, CompatibilityResult>> checkBatch(@Valid @RequestBody BatchCompatibilityRequest req) {
        Build base = buildService.buildFromRequest(req.current());
        Map<Long, CompatibilityResult> results = new LinkedHashMap<>();

        for (Long candidateId : req.candidateIds()) {
            Component candidate;
            try {
                candidate = componentService.getComponentEntity(candidateId);
            } catch (ResourceNotFoundException ex) {
                results.put(candidateId, new CompatibilityResult(false, List.of("Component not found")));
                continue;
            }
            substituteIntoSlot(base, req.slot(), candidate);
            List<String> errors = compatibilityService.checkBuildCompatibility(base);
            results.put(candidateId, new CompatibilityResult(errors.isEmpty(), errors));
        }

        return ResponseEntity.ok(results);
    }

    private void substituteIntoSlot(Build build, String slot, Component candidate) {
        switch (slot) {
            case "cpu" -> build.setCpu(candidate);
            case "gpu" -> build.setGpu(candidate);
            case "motherboard" -> build.setMotherboard(candidate);
            case "psu" -> build.setPsu(candidate);
            case "case" -> build.setPcCase(candidate);
            case "cooler" -> build.setCooler(candidate);
            case "ram-0" -> build.setRam1(candidate);
            case "ram-1" -> build.setRam2(candidate);
            case "ram-2" -> build.setRam3(candidate);
            case "ram-3" -> build.setRam4(candidate);
            case "storage-0" -> build.setStorage1(candidate);
            case "storage-1" -> build.setStorage2(candidate);
            default -> throw new IllegalArgumentException("Unknown slot: " + slot);
        }
    }
}
