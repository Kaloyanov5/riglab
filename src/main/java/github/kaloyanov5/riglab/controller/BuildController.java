package github.kaloyanov5.riglab.controller;

import github.kaloyanov5.riglab.dto.BuildRequest;
import github.kaloyanov5.riglab.dto.BuildResponse;
import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;
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
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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
    @Operation(summary = "Get all builds", description = "Retrieve a list of all saved PC builds")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all builds")
    public ResponseEntity<List<BuildResponse>> getAllBuilds() {
        return ResponseEntity.ok(buildService.getAllBuilds());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get build by ID", description = "Retrieve a specific PC build by its ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Build found"),
            @ApiResponse(responseCode = "404", description = "Build not found")
    })
    public ResponseEntity<BuildResponse> getBuildById(
            @Parameter(description = "Build ID") @PathVariable Long id) {
        return ResponseEntity.ok(buildService.getBuildById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new build", description = "Create a new PC build with compatibility validation. Validates socket compatibility, RAM type/slots, form factor, GPU clearance, storage slots, cooler support, and power requirements.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Build created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation or compatibility error")
    })
    public ResponseEntity<BuildResponse> createBuild(@Valid @RequestBody BuildRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(buildService.createBuild(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a build", description = "Update an existing PC build and re-validate compatibility")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Build updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation or compatibility error"),
            @ApiResponse(responseCode = "404", description = "Build not found")
    })
    public ResponseEntity<BuildResponse> updateBuild(
            @Parameter(description = "Build ID") @PathVariable Long id,
            @Valid @RequestBody BuildRequest request) {
        return ResponseEntity.ok(buildService.updateBuild(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a build", description = "Delete a PC build by its ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Build deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Build not found")
    })
    public ResponseEntity<Void> deleteBuild(
            @Parameter(description = "Build ID") @PathVariable Long id) {
        buildService.deleteBuild(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-compatibility")
    @Operation(summary = "Check build compatibility", description = "Validate compatibility of a build configuration without saving it. Returns a list of compatibility errors (empty if compatible).")
    @ApiResponse(responseCode = "200", description = "Compatibility check result")
    public ResponseEntity<Map<String, Object>> checkCompatibility(@RequestBody BuildRequest request) {
        Build build = new Build();
        build.setName(request.name() != null ? request.name() : "check");

        if (request.cpuId() != null) build.setCpu(componentService.getComponentEntity(request.cpuId()));
        if (request.gpuId() != null) build.setGpu(componentService.getComponentEntity(request.gpuId()));
        if (request.motherboardId() != null) build.setMotherboard(componentService.getComponentEntity(request.motherboardId()));
        if (request.psuId() != null) build.setPsu(componentService.getComponentEntity(request.psuId()));
        if (request.caseId() != null) build.setPcCase(componentService.getComponentEntity(request.caseId()));

        if (request.ramIds() != null) {
            List<Component> rams = new ArrayList<>();
            for (Long id : request.ramIds()) rams.add(componentService.getComponentEntity(id));
            build.setRamSticks(rams);
        }
        if (request.storageIds() != null) {
            List<Component> storages = new ArrayList<>();
            for (Long id : request.storageIds()) storages.add(componentService.getComponentEntity(id));
            build.setStorageDevices(storages);
        }
        if (request.coolerIds() != null) {
            List<Component> coolers = new ArrayList<>();
            for (Long id : request.coolerIds()) coolers.add(componentService.getComponentEntity(id));
            build.setCoolers(coolers);
        }

        List<String> errors = compatibilityService.checkBuildCompatibility(build);
        return ResponseEntity.ok(Map.of("compatible", errors.isEmpty(), "errors", errors));
    }
}

