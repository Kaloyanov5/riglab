package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long>, JpaSpecificationExecutor<Component> {

    @Query("SELECT DISTINCT c.brand FROM Component c WHERE c.type = :type ORDER BY c.brand")
    List<String> findDistinctBrandsByType(ComponentType type);

    @Query("SELECT DISTINCT c.brand FROM Component c ORDER BY c.brand")
    List<String> findDistinctBrands();

    List<Component> findByType(ComponentType type);

    List<Component> findByNameContainingIgnoreCase(String name);
}
