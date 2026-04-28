package github.kaloyanov5.riglab.repository;

import github.kaloyanov5.riglab.entity.Build;
import github.kaloyanov5.riglab.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildRepository extends JpaRepository<Build, Long> {

    List<Build> findByOwner(User owner);

    List<Build> findByOwnerOrderByIdDesc(User owner);

    boolean existsByOwnerAndNameIgnoreCase(User owner, String name);

    boolean existsByOwnerAndNameIgnoreCaseAndIdNot(User owner, String name, Long id);
}
