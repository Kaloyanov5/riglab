package github.kaloyanov5.riglab.controller;

import github.kaloyanov5.riglab.dto.ComponentRequest;
import github.kaloyanov5.riglab.dto.ComponentResponse;
import github.kaloyanov5.riglab.entity.ComponentType;
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

import java.util.List;

@RestController
@RequestMapping("/api/components")
@RequiredArgsConstructor
@Tag(name = "Components", description = "PC Component management - CPU, GPU, RAM, Motherboard, PSU, Case, Storage, Cooler")
public class ComponentController {

    private final ComponentService componentService;

    @GetMapping
    @Operation(summary = "Get all components", description = "Retrieve a list of all available PC components")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all components")
    public ResponseEntity<List<ComponentResponse>> getAllComponents() {
        return ResponseEntity.ok(componentService.getAllComponents());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get component by ID", description = "Retrieve a specific component by its ID, including type-specific details")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Component found"),
            @ApiResponse(responseCode = "404", description = "Component not found")
    })
    public ResponseEntity<ComponentResponse> getComponentById(
            @Parameter(description = "Component ID") @PathVariable Long id) {
        return ResponseEntity.ok(componentService.getComponentById(id));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get components by type", description = "Retrieve all components of a specific type (CPU, GPU, RAM, MOTHERBOARD, PSU, CASE, COOLER, STORAGE)")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved components")
    public ResponseEntity<List<ComponentResponse>> getComponentsByType(
            @Parameter(description = "Component type", example = "CPU") @PathVariable ComponentType type) {
        return ResponseEntity.ok(componentService.getComponentsByType(type));
    }

    @GetMapping("/search")
    @Operation(summary = "Search components", description = "Search components by name (case-insensitive partial match)")
    @ApiResponse(responseCode = "200", description = "Search results returned")
    public ResponseEntity<List<ComponentResponse>> searchComponents(
            @Parameter(description = "Search query") @RequestParam String name) {
        return ResponseEntity.ok(componentService.searchComponents(name));
    }

    @PostMapping
    @Operation(summary = "Create a component", description = "Add a new PC component to the catalog with optional type-specific details")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Component created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<ComponentResponse> createComponent(@Valid @RequestBody ComponentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(componentService.createComponent(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a component", description = "Update an existing component and its type-specific details")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Component updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "404", description = "Component not found")
    })
    public ResponseEntity<ComponentResponse> updateComponent(
            @Parameter(description = "Component ID") @PathVariable Long id,
            @Valid @RequestBody ComponentRequest request) {
        return ResponseEntity.ok(componentService.updateComponent(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a component", description = "Delete a component from the catalog")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Component deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Component not found")
    })
    public ResponseEntity<Void> deleteComponent(
            @Parameter(description = "Component ID") @PathVariable Long id) {
        componentService.deleteComponent(id);
        return ResponseEntity.noContent().build();
    }
}

