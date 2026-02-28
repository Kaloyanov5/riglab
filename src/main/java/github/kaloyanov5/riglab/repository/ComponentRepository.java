package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Component;
import github.kaloyanov5.riglab.entity.ComponentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {

    @Query("SELECT DISTINCT c.brand FROM Component c WHERE c.type = :type ORDER BY c.brand")
    List<String> findDistinctBrandsByType(ComponentType type);

    @Query("SELECT DISTINCT c.brand FROM Component c ORDER BY c.brand")
    List<String> findDistinctBrands();

    List<Component> findByType(ComponentType type);

    Page<Component> findByType(ComponentType type, Pageable pageable);

    List<Component> findByBrand(String brand);

    List<Component> findByTypeAndPriceLessThanEqual(ComponentType type, Double maxPrice);

    List<Component> findByNameContainingIgnoreCase(String name);

    Page<Component> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Component> findByTypeAndNameContainingIgnoreCase(ComponentType type, String name, Pageable pageable);

    // Price range queries
    Page<Component> findByPriceBetween(Double minPrice, Double maxPrice, Pageable pageable);

    Page<Component> findByTypeAndPriceBetween(ComponentType type, Double minPrice, Double maxPrice, Pageable pageable);

    Page<Component> findByNameContainingIgnoreCaseAndPriceBetween(String name, Double minPrice, Double maxPrice, Pageable pageable);

    Page<Component> findByTypeAndNameContainingIgnoreCaseAndPriceBetween(ComponentType type, String name, Double minPrice, Double maxPrice, Pageable pageable);
}
