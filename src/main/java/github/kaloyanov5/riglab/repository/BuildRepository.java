package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Build;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildRepository extends JpaRepository<Build, Long> {

    List<Build> findByNameContainingIgnoreCase(String name);

    List<Build> findByTotalPriceLessThanEqual(Double maxPrice);
}

