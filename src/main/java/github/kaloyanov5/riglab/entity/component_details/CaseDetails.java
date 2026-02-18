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
@Table(name = "case_details")
public class CaseDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private Component component;

    @NotBlank
    private String supportedFormFactor; // ATX, Micro-ATX
    @Positive
    private Integer maxGpuLengthMm;
}
