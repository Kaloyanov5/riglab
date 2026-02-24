package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {

    List<Component> findByType(ComponentType type);

    Page<Component> findByType(ComponentType type, Pageable pageable);

    List<Component> findByBrand(String brand);

    List<Component> findByTypeAndPriceLessThanEqual(ComponentType type, Double maxPrice);

    List<Component> findByNameContainingIgnoreCase(String name);

    Page<Component> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Component> findByTypeAndNameContainingIgnoreCase(ComponentType type, String name, Pageable pageable);
}
