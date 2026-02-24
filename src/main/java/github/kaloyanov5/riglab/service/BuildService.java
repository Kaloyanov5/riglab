package github.kaloyanov5.riglab.service;

import github.kaloyanov5.riglab.dto.BuildRequest;
import github.kaloyanov5.riglab.dto.BuildResponse;
import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.exception.ResourceNotFoundException;
import github.kaloyanov5.riglab.repository.BuildRepository;
import lombok.RequiredArgsConstructor;
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

    public List<BuildResponse> getAllBuilds() {
        return buildRepository.findAll().stream().map(BuildResponse::fromEntity).toList();
    }

    public BuildResponse getBuildById(Long id) {
        return buildRepository.findById(id)
                .map(BuildResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Build", id));
    }

    @Transactional
    public BuildResponse createBuild(BuildRequest request) {
        Build build = new Build();
        build.setName(request.name());

        build.setCpu(componentService.getComponentEntity(request.cpuId()));
        build.setMotherboard(componentService.getComponentEntity(request.motherboardId()));
        build.setPsu(componentService.getComponentEntity(request.psuId()));
        build.setPcCase(componentService.getComponentEntity(request.caseId()));

        if (request.gpuId() != null) {
            build.setGpu(componentService.getComponentEntity(request.gpuId()));
        }

        List<Component> ramSticks = new ArrayList<>();
        for (Long ramId : request.ramIds()) {
            ramSticks.add(componentService.getComponentEntity(ramId));
        }
        build.setRamSticks(ramSticks);

        if (request.storageIds() != null && !request.storageIds().isEmpty()) {
            List<Component> storageDevices = new ArrayList<>();
            for (Long storageId : request.storageIds()) {
                storageDevices.add(componentService.getComponentEntity(storageId));
            }
            build.setStorageDevices(storageDevices);
        }

        if (request.coolerIds() != null && !request.coolerIds().isEmpty()) {
            List<Component> coolers = new ArrayList<>();
            for (Long coolerId : request.coolerIds()) {
                coolers.add(componentService.getComponentEntity(coolerId));
            }
            build.setCoolers(coolers);
        }

        compatibilityService.validateBuildCompatibility(build);
        build.setTotalPrice(calculateTotalPrice(build));

        return BuildResponse.fromEntity(buildRepository.save(build));
    }

    @Transactional
    public BuildResponse updateBuild(Long id, BuildRequest request) {
        Build build = buildRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Build", id));

        build.setName(request.name());
        build.setCpu(componentService.getComponentEntity(request.cpuId()));
        build.setMotherboard(componentService.getComponentEntity(request.motherboardId()));
        build.setPsu(componentService.getComponentEntity(request.psuId()));
        build.setPcCase(componentService.getComponentEntity(request.caseId()));

        build.setGpu(request.gpuId() != null ? componentService.getComponentEntity(request.gpuId()) : null);

        List<Component> ramSticks = new ArrayList<>();
        for (Long ramId : request.ramIds()) {
            ramSticks.add(componentService.getComponentEntity(ramId));
        }
        build.setRamSticks(ramSticks);

        if (request.storageIds() != null) {
            List<Component> storageDevices = new ArrayList<>();
            for (Long storageId : request.storageIds()) {
                storageDevices.add(componentService.getComponentEntity(storageId));
            }
            build.setStorageDevices(storageDevices);
        }

        if (request.coolerIds() != null) {
            List<Component> coolers = new ArrayList<>();
            for (Long coolerId : request.coolerIds()) {
                coolers.add(componentService.getComponentEntity(coolerId));
            }
            build.setCoolers(coolers);
        }

        compatibilityService.validateBuildCompatibility(build);
        build.setTotalPrice(calculateTotalPrice(build));

        return BuildResponse.fromEntity(buildRepository.save(build));
    }

    @Transactional
    public void deleteBuild(Long id) {
        if (!buildRepository.existsById(id)) {
            throw new ResourceNotFoundException("Build", id);
        }
        buildRepository.deleteById(id);
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

