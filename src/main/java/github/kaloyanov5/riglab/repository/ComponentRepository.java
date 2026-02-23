package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {

    List<Component> findByType(ComponentType type);

    List<Component> findByBrand(String brand);

    List<Component> findByTypeAndPriceLessThanEqual(ComponentType type, Double maxPrice);

    List<Component> findByNameContainingIgnoreCase(String name);
}

