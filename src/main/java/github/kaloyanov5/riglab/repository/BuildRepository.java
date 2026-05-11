package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildRepository extends JpaRepository<Build, Long> {

    List<Build> findByOwner(User owner);

    List<Build> findByOwnerOrderByIdDesc(User owner);

    boolean existsByOwnerAndNameIgnoreCase(User owner, String name);

    boolean existsByOwnerAndNameIgnoreCaseAndIdNot(User owner, String name, Long id);

    @Modifying
    @Query(value = "UPDATE builds SET " +
            "cpu_id         = NULLIF(cpu_id, :id), " +
            "gpu_id         = NULLIF(gpu_id, :id), " +
            "motherboard_id = NULLIF(motherboard_id, :id), " +
            "psu_id         = NULLIF(psu_id, :id), " +
            "pc_case_id     = NULLIF(pc_case_id, :id), " +
            "cooler_id      = NULLIF(cooler_id, :id), " +
            "ram1_id        = NULLIF(ram1_id, :id), " +
            "ram2_id        = NULLIF(ram2_id, :id), " +
            "ram3_id        = NULLIF(ram3_id, :id), " +
            "ram4_id        = NULLIF(ram4_id, :id), " +
            "storage1_id    = NULLIF(storage1_id, :id), " +
            "storage2_id    = NULLIF(storage2_id, :id) " +
            "WHERE cpu_id = :id OR gpu_id = :id OR motherboard_id = :id OR psu_id = :id " +
            "   OR pc_case_id = :id OR cooler_id = :id " +
            "   OR ram1_id = :id OR ram2_id = :id OR ram3_id = :id OR ram4_id = :id " +
            "   OR storage1_id = :id OR storage2_id = :id",
            nativeQuery = true)
    int clearComponentReferences(@Param("id") Long componentId);
}
