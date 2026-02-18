package github.kaloyanov5.riglab.entity.component_details;

import github.kaloyanov5.riglab.entity.Component;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "ram_details")
public class RamDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @Positive
    private Integer capacityGb;
    @NotBlank
    private String type; // DDR4 / DDR5
    @Positive
    private Integer speedMhz;
}
