package github.kaloyanov5.riglab.entity.component_details;

import github.kaloyanov5.riglab.entity.Component;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "cpu_details")
public class CpuDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @NotBlank
    private String socket;
    @Positive
    private Integer cores;
    @Positive
    private Integer threads;
    @Positive
    private Double baseClock;
    @Positive
    private Double boostClock;
}
