package github.kaloyanov5.riglab.service;

import github.kaloyanov5.riglab.dto.BuildRequest;
import github.kaloyanov5.riglab.dto.BuildResponse;
import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.Role;
import github.kaloyanov5.riglab.entity.User;
import github.kaloyanov5.riglab.exception.ResourceNotFoundException;
import github.kaloyanov5.riglab.repository.BuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuildService {

    private final BuildRepository buildRepository;
    private final ComponentService componentService;
    private final CompatibilityService compatibilityService;
    private final UserService userService;

    public List<BuildResponse> getAllBuilds() {
        return buildRepository.findAll().stream().map(BuildResponse::fromEntity).toList();
    }

    public List<BuildResponse> getMyBuilds(String username) {
        User user = userService.getByUsername(username);
        return buildRepository.findByOwnerOrderByIdDesc(user).stream()
                .map(BuildResponse::fromEntity)
                .toList();
    }

    public BuildResponse getBuildById(Long id) {
        return buildRepository.findById(id)
                .map(BuildResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Build", id));
    }

    @Transactional
    public BuildResponse createBuild(BuildRequest request, String ownerUsername) {
        Build build = new Build();
        build.setName(request.name());
        if (ownerUsername != null) {
            User owner = userService.getByUsername(ownerUsername);
            if (buildRepository.existsByOwnerAndNameIgnoreCase(owner, request.name())) {
                throw new IllegalArgumentException("You already have a build named '" + request.name() + "'");
            }
            build.setOwner(owner);
        }
        applyRequestToBuild(request, build);

        compatibilityService.validateBuildCompatibility(build);
        build.setTotalPrice(calculateTotalPrice(build));

        return BuildResponse.fromEntity(buildRepository.save(build));
    }

    @Transactional
    public BuildResponse updateBuild(Long id, BuildRequest request, String currentUsername) {
        Build build = buildRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Build", id));

        assertOwnedBy(build, currentUsername);

        if (build.getOwner() != null
                && buildRepository.existsByOwnerAndNameIgnoreCaseAndIdNot(build.getOwner(), request.name(), id)) {
            throw new IllegalArgumentException("You already have a build named '" + request.name() + "'");
        }

        build.setName(request.name());
        applyRequestToBuild(request, build);

        compatibilityService.validateBuildCompatibility(build);
        build.setTotalPrice(calculateTotalPrice(build));

        return BuildResponse.fromEntity(buildRepository.save(build));
    }

    @Transactional
    public void deleteBuild(Long id, String currentUsername) {
        Build build = buildRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Build", id));
        assertOwnedBy(build, currentUsername);
        buildRepository.delete(build);
    }

    private void assertOwnedBy(Build build, String currentUsername) {
        if (currentUsername == null) {
            throw new AccessDeniedException("Authentication required");
        }
        User current = userService.getByUsername(currentUsername);
        if (current.getRole() == Role.ADMIN) return;
        if (build.getOwner() == null || !build.getOwner().getId().equals(current.getId())) {
            throw new AccessDeniedException("You do not own this build");
        }
    }

    private void applyRequestToBuild(BuildRequest request, Build build) {
        build.setCpu(componentService.getComponentEntity(request.cpuId()));
        build.setMotherboard(componentService.getComponentEntity(request.motherboardId()));
        build.setPsu(componentService.getComponentEntity(request.psuId()));
        build.setPcCase(componentService.getComponentEntity(request.caseId()));
        build.setGpu(request.gpuId() != null ? componentService.getComponentEntity(request.gpuId()) : null);

        List<Component> ramSticks = new ArrayList<>();
        if (request.ramIds() != null) {
            for (Long ramId : request.ramIds()) ramSticks.add(componentService.getComponentEntity(ramId));
        }
        build.setRamSticks(ramSticks);

        List<Component> storageDevices = new ArrayList<>();
        if (request.storageIds() != null) {
            for (Long sid : request.storageIds()) storageDevices.add(componentService.getComponentEntity(sid));
        }
        build.setStorageDevices(storageDevices);

        List<Component> coolers = new ArrayList<>();
        if (request.coolerIds() != null) {
            for (Long cid : request.coolerIds()) coolers.add(componentService.getComponentEntity(cid));
        }
        build.setCoolers(coolers);
    }

    public Build buildFromRequest(BuildRequest request) {
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
        return build;
    }

    private Double calculateTotalPrice(Build build) {
        double total = 0.0;
        if (build.getCpu() != null && build.getCpu().getPrice() != null) total += build.getCpu().getPrice();
        if (build.getGpu() != null && build.getGpu().getPrice() != null) total += build.getGpu().getPrice();
        if (build.getMotherboard() != null && build.getMotherboard().getPrice() != null) total += build.getMotherboard().getPrice();
        if (build.getPsu() != null && build.getPsu().getPrice() != null) total += build.getPsu().getPrice();
        if (build.getPcCase() != null && build.getPcCase().getPrice() != null) total += build.getPcCase().getPrice();
        for (Component ram : build.getRamSticks()) if (ram.getPrice() != null) total += ram.getPrice();
        for (Component storage : build.getStorageDevices()) if (storage.getPrice() != null) total += storage.getPrice();
        for (Component cooler : build.getCoolers()) if (cooler.getPrice() != null) total += cooler.getPrice();
        return total;
    }
}
